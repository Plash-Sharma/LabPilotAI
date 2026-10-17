import json
import logging
import os
import random
import time
from typing import Any
from uuid import UUID

from google import genai
from google.genai import types
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import MCQAttempt, MCQQuestion, MCQTest, Submission

logger = logging.getLogger(__name__)


class MCQService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.client = None
        api_key = os.getenv("GEMINI_API_KEY")
        try:
            if api_key:
                self.client = genai.Client(api_key=api_key)
            else:
                self.client = genai.Client()
        except Exception as e:
            logger.warning("Could not initialize Gemini client: %s", e)
            self.client = None

    async def get_existing_question_texts(self, submission_id: UUID) -> list[str]:
        """Fetch all previously generated question texts for this submission to avoid repeats."""
        stmt = (
            select(MCQQuestion.question_text)
            .join(MCQTest, MCQQuestion.test_id == MCQTest.id)
            .where(MCQTest.submission_id == submission_id)
        )
        result = await self.db.execute(stmt)
        return [row[0] for row in result.all()]

    async def generate_mcq_test(
        self,
        submission: Submission,
        user_id: UUID,
        num_questions: int = 10,
    ) -> MCQTest:
        """
        Generate a fresh MCQ test of 10 to 15 questions based on the submission.
        Guarantees varied/different questions on each generation by providing past questions
        to the prompt and requesting distinct conceptual/practical angles.
        """
        num_questions = max(10, min(15, num_questions))
        existing_questions = await self.get_existing_question_texts(submission.id)

        # Build context from submission
        topic = submission.subject_of_lab or submission.filename or "Computer Science Lab Experiment"
        aim_text = submission.aim or "Not specified"
        algorithm_text = (submission.algorithm or "")[:1000]
        output_text = (submission.output or "")[:1000]

        # Extract structured problems if submission.code is a JSON list of problems
        problems_summary: list[str] = []
        try:
            parsed_probs = json.loads(submission.code)
            if isinstance(parsed_probs, list) and parsed_probs:
                for idx, p in enumerate(parsed_probs[:4]):
                    q_title = p.get("question", f"Problem {idx+1}")
                    p_code = p.get("code", "")[:800]
                    p_out = p.get("output", "")[:300]
                    p_lang = p.get("language", "cpp")
                    problems_summary.append(f"Problem {idx+1} ({p_lang}): {q_title}\nCode:\n{p_code}\nOutput: {p_out}")
        except Exception:
            pass

        if problems_summary:
            code_text = "\n\n".join(problems_summary)
            if aim_text == "MULTI_PROBLEM" or not aim_text:
                aim_text = " | ".join([p.split("\n")[0] for p in problems_summary])
        else:
            code_text = (submission.code or "")[:2500]

        context_text = f"""
Topic: {topic}
Aim / Problem Statement:
{aim_text}

Algorithm / Approach:
{algorithm_text}

Student's Implementation Code:
{code_text}

Observed Output / Execution Result:
{output_text}
"""

        raw_questions: list[dict[str, Any]] = []

        if self.client:
            raw_questions = await self._generate_with_gemini(
                context_text=context_text,
                topic=topic,
                num_questions=num_questions,
                existing_questions=existing_questions,
            )

        # If Gemini didn't return enough or timed out, use our smart domain synthesis generator
        if len(raw_questions) < num_questions:
            logger.info("Augmenting or generating MCQs via instant domain synthesis generator")
            fallback_qs = self._generate_fallback_questions(
                submission=submission,
                num_needed=num_questions - len(raw_questions),
                existing_texts=existing_questions + [q.get("question", "") for q in raw_questions],
            )
            raw_questions.extend(fallback_qs)

        raw_questions = raw_questions[:num_questions]

        # Create MCQTest entity
        test_title = f"{topic} Knowledge Check"
        if submission.filename:
            test_title = f"{submission.filename} - MCQ Test"

        mcq_test = MCQTest(
            submission_id=submission.id,
            user_id=user_id,
            title=test_title,
            topic=topic,
            total_questions=len(raw_questions),
        )
        self.db.add(mcq_test)
        await self.db.flush()

        # Add questions
        for idx, q_data in enumerate(raw_questions):
            options = q_data.get("options", ["Option A", "Option B", "Option C", "Option D"])
            # Ensure options has 4 items
            if len(options) < 4:
                while len(options) < 4:
                    options.append(f"Additional Option {len(options)+1}")
            elif len(options) > 4:
                options = options[:4]

            correct_idx = q_data.get("correct_index", 0)
            if not isinstance(correct_idx, int) or correct_idx < 0 or correct_idx >= 4:
                correct_idx = 0

            question_obj = MCQQuestion(
                test_id=mcq_test.id,
                order_index=idx + 1,
                question_text=q_data.get("question", f"Question {idx+1}"),
                options=options,
                correct_index=correct_idx,
                explanation=q_data.get("explanation", "Review the concept in the lab material."),
                difficulty=q_data.get("difficulty", "medium"),
                concept=q_data.get("concept", "Core Theory"),
            )
            self.db.add(question_obj)

        await self.db.commit()
        await self.db.refresh(mcq_test, ["questions"])
        return mcq_test

    async def _generate_with_gemini(
        self,
        context_text: str,
        topic: str,
        num_questions: int,
        existing_questions: list[str],
    ) -> list[dict[str, Any]]:
        """Call Gemini flash-lite with strict timeout to generate high-quality MCQs quickly."""
        import asyncio

        models_to_try = [
            os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite"),
            "gemini-3.5-flash-lite",
            "gemini-3.1-flash-lite",
        ]

        # Extract recent question snippets to avoid duplication
        avoid_clause = ""
        if existing_questions:
            sample_past = existing_questions[-15:]
            past_bullet_points = "\n".join([f"- {q[:100]}" for q in sample_past])
            avoid_clause = f"DO NOT duplicate these previous questions:\n{past_bullet_points}\n"

        prompt = f"""
You are a university professor for "{topic}". Generate exactly {num_questions} rigorous, diverse MCQs based on the lab experiment details.
{avoid_clause}
Requirements:
1. Cover theory, code behavior, output analysis, complexity, and edge cases.
2. 4 plausible options per question, exactly 1 correct (index 0, 1, 2, or 3).
3. Educational explanation.
4. Return strict JSON array:
[
  {{
    "question": "Question text...",
    "options": ["A", "B", "C", "D"],
    "correct_index": 0,
    "explanation": "Explanation...",
    "difficulty": "easy|medium|hard",
    "concept": "Concept Tag"
  }}
]

Lab Context:
{context_text}
"""

        def run_call(model_name: str):
            return self.client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.7,
                ),
            )

        for model_name in models_to_try:
            try:
                # 5.0 second strict timeout per attempt to guarantee fast user experience
                response = await asyncio.wait_for(
                    asyncio.to_thread(run_call, model_name),
                    timeout=5.0
                )
                if response and response.text:
                    parsed = json.loads(response.text)
                    if isinstance(parsed, list) and len(parsed) > 0:
                        logger.info("Successfully generated %d MCQs via %s in <5s", len(parsed), model_name)
                        return parsed
            except asyncio.TimeoutError:
                logger.warning("Gemini model %s timed out after 5.0s, proceeding to fast synthesis", model_name)
                break
            except Exception as e:
                logger.warning("Gemini generation with %s failed: %s. Trying next...", model_name, e)

        return []

    def _generate_fallback_questions(
        self,
        submission: Submission,
        num_needed: int,
        existing_texts: list[str],
    ) -> list[dict[str, Any]]:
        """
        Intelligent fallback question bank derived from submission details.
        Ensures diverse question variants without crashing if Gemini is offline.
        """
        topic = submission.subject_of_lab or "Computer Science"
        aim = submission.aim or "lab programming logic"

        # Pool of diverse question templates
        pool = [
            {
                "question": f"In the context of '{aim}', what is the primary role of the main logic implemented?",
                "options": [
                    "To structure and execute the core algorithm step-by-step",
                    "To bypass standard memory bounds during compilation",
                    "To convert source code into interpreted bytecode only",
                    "To eliminate the need for input sanitization",
                ],
                "correct_index": 0,
                "explanation": "The main logic encapsulates the key algorithmic procedure designed to satisfy the experiment objective.",
                "difficulty": "easy",
                "concept": "Core Architecture",
            },
            {
                "question": f"When executing code for '{topic}', what happens if user input is empty or of unexpected type?",
                "options": [
                    "The program gracefully re-prompts or triggers a runtime exception/crash depending on error handling",
                    "The compiler automatically corrects user input at runtime",
                    "Operating system terminates the kernel immediately",
                    "Hardware CPU registers are reset to factory defaults",
                ],
                "correct_index": 0,
                "explanation": "Without explicit input validation, reading mismatched types from STDIN typically causes an input stream failure or runtime exception.",
                "difficulty": "medium",
                "concept": "Input Validation",
            },
            {
                "question": "What is the typical time complexity expectation for standard linear search vs binary search on sorted data?",
                "options": [
                    "Linear search is O(n), Binary search is O(log n)",
                    "Linear search is O(log n), Binary search is O(n)",
                    "Both require O(n^2) in all cases",
                    "Binary search requires O(1) space and O(n!) time",
                ],
                "correct_index": 0,
                "explanation": "Linear search checks elements one-by-one (O(n)), whereas binary search halves the search space each step (O(log n)).",
                "difficulty": "easy",
                "concept": "Complexity Analysis",
            },
            {
                "question": "Which of the following best describes memory management for variables allocated on the stack vs heap?",
                "options": [
                    "Stack memory is deallocated automatically on function exit; heap memory requires explicit release or garbage collection",
                    "Heap memory is always faster and strictly scoped to local functions",
                    "Stack memory cannot store primitive variables",
                    "Heap memory is restricted to read-only constant data",
                ],
                "correct_index": 0,
                "explanation": "Stack frames are automatically popped when a function terminates, while heap memory remains allocated until explicitly freed or GC'd.",
                "difficulty": "medium",
                "concept": "Memory Management",
            },
            {
                "question": "In object-oriented programming, which principle allows different classes to respond to the same method call with distinct implementations?",
                "options": [
                    "Polymorphism",
                    "Encapsulation",
                    "Data Redundancy",
                    "Serialization",
                ],
                "correct_index": 0,
                "explanation": "Polymorphism enables an entity such as a variable, function, or object to have more than one form (e.g. via virtual methods/overriding).",
                "difficulty": "easy",
                "concept": "OOP Principles",
            },
            {
                "question": "What is the danger of missing a base condition in a recursive function?",
                "options": [
                    "Infinite recursion leading to a stack overflow error",
                    "Immediate syntax compilation error",
                    "Overwriting hard drive sectors",
                    "Automatic conversion into an iterative loop",
                ],
                "correct_index": 0,
                "explanation": "Without a terminating base condition, recursive calls continue allocating new stack frames until call stack memory is exhausted.",
                "difficulty": "medium",
                "concept": "Recursion & Call Stack",
            },
            {
                "question": f"Regarding the output recorded in this lab ({submission.output[:40] if submission.output else 'standard terminal output'}...), how is correctness verified?",
                "options": [
                    "By validating output values against expected analytical results and test vectors",
                    "By checking if the code compiles without warnings only",
                    "By ensuring the file size of the executable is under 1KB",
                    "By running the code with CPU frequency throttled",
                ],
                "correct_index": 0,
                "explanation": "Verification requires checking that the actual output strictly aligns with the problem's mathematical or logical specification.",
                "difficulty": "easy",
                "concept": "Verification & Testing",
            },
            {
                "question": "Which operator or method is standard for comparing deep equality versus reference identity in modern languages?",
                "options": [
                    "Value comparison operators/methods compare internal content, while identity operators compare memory addresses",
                    "Identity operators compare string length, value operators compare types only",
                    "All languages only support reference comparison",
                    "There is no distinction between memory address and value",
                ],
                "correct_index": 0,
                "explanation": "Reference equality tests if both pointers point to the exact same memory location, while value equality checks state equivalence.",
                "difficulty": "medium",
                "concept": "Language Semantics",
            },
            {
                "question": "What is the primary benefit of modular programming into distinct functions or classes?",
                "options": [
                    "Enhanced code reusability, testability, and separation of concerns",
                    "Guaranteed linear execution speed regardless of algorithms used",
                    "Complete protection against all syntax errors",
                    "Elimination of the need for compiler optimization",
                ],
                "correct_index": 0,
                "explanation": "Modularity divides a program into separate sub-tasks, making it easier to read, maintain, test, and debug.",
                "difficulty": "easy",
                "concept": "Software Design",
            },
            {
                "question": "What is an 'off-by-one' error commonly associated with in programming?",
                "options": [
                    "Loop boundary conditions such as iterating past array bounds (e.g., using '<=' instead of '<')",
                    "Misspelling variable names in declarations",
                    "Running out of disk storage during download",
                    "Missing a semicolon at the end of a line",
                ],
                "correct_index": 0,
                "explanation": "Off-by-one errors occur when an iterative loop iterates one time too many or one time too few due to incorrect relational operators.",
                "difficulty": "medium",
                "concept": "Debugging & Edge Cases",
            },
            {
                "question": "What does a time complexity of O(1) signify for a data structure operation?",
                "options": [
                    "Constant time: the operation executes in bounded time regardless of dataset size",
                    "The operation takes exactly 1 nanosecond",
                    "The operation can only be executed once per program run",
                    "The data structure can only hold 1 element",
                ],
                "correct_index": 0,
                "explanation": "O(1) indicates that runtime does not scale with the size of the input (constant time complexity).",
                "difficulty": "easy",
                "concept": "Asymptotic Notation",
            },
            {
                "question": "Why is it important to close file descriptors and network sockets after their use in code?",
                "options": [
                    "To prevent resource leaks and release OS file handles back to the system",
                    "Because open files cause immediate computer reboot",
                    "To encrypt the file contents automatically",
                    "Because closed files compile faster",
                ],
                "correct_index": 0,
                "explanation": "Operating systems have a limit on open file descriptors. Failure to close them leads to resource exhaustion and file lock issues.",
                "difficulty": "medium",
                "concept": "Resource Management",
            },
            {
                "question": "What is the role of pass-by-reference compared to pass-by-value in function arguments?",
                "options": [
                    "Pass-by-reference avoids copying large structures and allows modifications to reflect in the caller's scope",
                    "Pass-by-value is always faster for structures of arbitrary size",
                    "Pass-by-reference prevents the function from accessing parameter values",
                    "Both methods behave identically in all languages and memory architectures",
                ],
                "correct_index": 0,
                "explanation": "Pass-by-reference shares the original object's address, saving memory copy overhead and enabling direct state updates.",
                "difficulty": "medium",
                "concept": "Parameter Passing",
            },
            {
                "question": "Which data structure uses LIFO (Last-In, First-Out) access order?",
                "options": [
                    "Stack",
                    "Queue",
                    "Hash Table",
                    "Priority Heap",
                ],
                "correct_index": 0,
                "explanation": "A Stack operates on a Last-In, First-Out (LIFO) protocol, whereas a Queue operates on FIFO.",
                "difficulty": "easy",
                "concept": "Data Structures",
            },
            {
                "question": "In software testing, what is 'boundary value analysis' (BVA)?",
                "options": [
                    "Testing inputs at the extreme lower and upper edges of permissible input ranges",
                    "Testing only random numbers between 1 and 10",
                    "Verifying if the monitor display edges align with UI windows",
                    "Testing the hardware voltage boundaries of the motherboard",
                ],
                "correct_index": 0,
                "explanation": "Boundary value analysis tests values at extremes (minimum, just above minimum, nominal, just below maximum, maximum) where defects often cluster.",
                "difficulty": "hard",
                "concept": "Software Testing",
            },
        ]

        # Shuffle and filter to produce different questions
        random.shuffle(pool)

        # Shuffle options for each question so correct_index isn't always 0
        formatted: list[dict[str, Any]] = []
        for item in pool:
            if any(existing.lower() in item["question"].lower() for existing in existing_texts if len(existing) > 10):
                continue

            orig_options = list(item["options"])
            correct_val = orig_options[item["correct_index"]]
            random.shuffle(orig_options)
            new_correct_idx = orig_options.index(correct_val)

            formatted.append({
                "question": item["question"],
                "options": orig_options,
                "correct_index": new_correct_idx,
                "explanation": item["explanation"],
                "difficulty": item["difficulty"],
                "concept": item["concept"],
            })

            if len(formatted) >= num_needed:
                break

        return formatted

    async def grade_mcq_test(
        self,
        test_id: UUID,
        user_id: UUID,
        selected_answers: dict[str, int],
    ) -> MCQAttempt:
        """
        Grade the student's test submission on the spot, evaluate level,
        compute topic strengths/weaknesses, and record attempt.
        """
        stmt = (
            select(MCQTest)
            .where(MCQTest.id == test_id)
            .options(selectinload(MCQTest.questions))
        )
        result = await self.db.execute(stmt)
        test = result.scalar_one_or_none()
        if not test:
            raise ValueError(f"MCQ Test {test_id} not found.")

        questions = sorted(test.questions, key=lambda q: q.order_index)
        total_questions = len(questions)
        if total_questions == 0:
            raise ValueError("Test contains no questions to grade.")

        score = 0
        concept_stats: dict[str, dict[str, int]] = {}
        difficulty_stats: dict[str, dict[str, int]] = {}

        for q in questions:
            q_id_str = str(q.id)
            user_choice = selected_answers.get(q_id_str)
            is_correct = (user_choice is not None) and (user_choice == q.correct_index)
            if is_correct:
                score += 1

            # Stats by concept
            concept = q.concept or "General"
            if concept not in concept_stats:
                concept_stats[concept] = {"correct": 0, "total": 0}
            concept_stats[concept]["total"] += 1
            if is_correct:
                concept_stats[concept]["correct"] += 1

            # Stats by difficulty
            diff = q.difficulty or "medium"
            if diff not in difficulty_stats:
                difficulty_stats[diff] = {"correct": 0, "total": 0}
            difficulty_stats[diff]["total"] += 1
            if is_correct:
                difficulty_stats[diff]["correct"] += 1

        percentage = round((score / total_questions) * 100, 1)

        # Student Level Evaluation
        if percentage >= 90.0:
            level = "Mastery (Level 4)"
            feedback = (
                "Outstanding performance! You demonstrated comprehensive mastery of the topic, "
                "handling both core principles and nuanced edge cases with exceptional accuracy."
            )
        elif percentage >= 75.0:
            level = "Proficient (Level 3)"
            feedback = (
                "Strong conceptual understanding! You possess a solid grasp of the lab's mechanics "
                "and logic. Reviewing a few specific edge cases will elevate your proficiency to complete mastery."
            )
        elif percentage >= 50.0:
            level = "Intermediate (Level 2)"
            feedback = (
                "Good working foundation. You understand the basic flow, but encountered difficulty on "
                "complex code tracing and boundary behavior. Re-trace your lab logic and review missed concepts."
            )
        else:
            level = "Beginner (Level 1)"
            feedback = (
                "Foundational practice recommended. Revisit the lab problem statement, trace through the source code "
                "step-by-step with pen and paper, and generate a new test to reinforce your understanding."
            )

        strengths = [
            f"{c} ({st['correct']}/{st['total']})"
            for c, st in concept_stats.items()
            if (st["correct"] / st["total"]) >= 0.75
        ]
        weaknesses = [
            f"{c} ({st['correct']}/{st['total']})"
            for c, st in concept_stats.items()
            if (st["correct"] / st["total"]) < 0.60
        ]

        analysis = {
            "concept_breakdown": concept_stats,
            "difficulty_breakdown": difficulty_stats,
            "strengths": strengths if strengths else ["Keep practicing across all concepts"],
            "weaknesses": weaknesses if weaknesses else ["None detected - consistent performance!"],
            "recommendation": (
                "Generate another fresh test on this lab record to verify mastery across new questions!"
                if percentage >= 75.0
                else "Review the detailed explanations below, study the missed concepts, then generate a new test."
            ),
        }

        attempt = MCQAttempt(
            test_id=test.id,
            user_id=user_id,
            score=score,
            total_questions=total_questions,
            percentage=percentage,
            level=level,
            feedback=feedback,
            analysis=analysis,
            selected_answers=selected_answers,
        )
        self.db.add(attempt)
        await self.db.commit()
        await self.db.refresh(attempt)
        return attempt


async def prewarm_mcq_test(submission_id_str: str, user_id_str: str) -> None:
    """
    Asynchronous Cache Pre-warming (System Design Principle):
    Pre-generates an initial MCQ test in the background when a submission is created,
    so that when the student navigates to the MCQ Test page, tests are ready instantly with 0ms wait time.
    """
    from app.core.database import AsyncSessionLocal
    try:
        async with AsyncSessionLocal() as session:
            submission = await session.get(Submission, UUID(submission_id_str))
            if not submission:
                return
            service = MCQService(session)
            await service.generate_mcq_test(submission, UUID(user_id_str), num_questions=10)
            logger.info("Pre-warmed MCQ test successfully for submission %s", submission_id_str)
    except Exception as e:
        logger.warning("Background MCQ pre-warming skipped: %s", e)

