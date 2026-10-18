import json
import logging
import os
import re
from pathlib import Path
from typing import Any

from google import genai
from google.genai import types
from PyPDF2 import PdfReader
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import DocumentChunk, Submission, VivaQuestion

logger = logging.getLogger(__name__)


class RAGService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.client = None
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        try:
            if api_key:
                self.client = genai.Client(api_key=api_key)
            else:
                self.client = genai.Client()
        except Exception as e:
            logger.warning("Could not initialize Gemini client: %s", e)
            self.client = None

    async def index_submission_pdf(self, submission: Submission, pdf_path: str) -> None:
        """Extract text from PDF, chunk it, embed, and store in DB."""
        if not self.client:
            logger.warning("Gemini client not initialized for PDF indexing.")
            return

        path = Path(pdf_path)
        if not path.exists():
            logger.error("PDF not found at %s", pdf_path)
            return

        try:
            reader = PdfReader(str(path))
            full_text = ""
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    full_text += text + "\n"

            if not full_text.strip():
                return

            chunk_size = 1000
            chunks = [full_text[i:i+chunk_size] for i in range(0, len(full_text), chunk_size)]

            for chunk_text in chunks:
                try:
                    response = self.client.models.embed_content(
                        model="gemini-embedding-001",
                        contents=chunk_text,
                        config=types.EmbedContentConfig(output_dimensionality=768),
                    )
                    embedding = response.embeddings[0].values
                    chunk = DocumentChunk(
                        submission_id=submission.id,
                        content=chunk_text,
                        embedding=embedding,
                    )
                    self.db.add(chunk)
                except Exception as embed_err:
                    logger.warning("Could not embed chunk: %s", embed_err)

            await self.db.commit()
            logger.info("Indexed chunks for submission %s", submission.id)
        except Exception as e:
            logger.error("Error during PDF indexing: %s", e)

    async def generate_viva_questions(self, submission: Submission, num_questions: int = 5) -> list[VivaQuestion]:
        """Generate viva questions using Gemini with automatic robust fallback."""
        created_questions: list[VivaQuestion] = []

        # Retrieve text context
        await self.db.refresh(submission, ["chunks"])
        if hasattr(submission, "chunks") and submission.chunks:
            context_text = "\n\n".join([chunk.content for chunk in submission.chunks])
        else:
            context_text = f"Subject: {submission.subject_of_lab or 'Computer Science'}\nAim: {submission.aim}\n\nCode:\n{submission.code}\n\nOutput:\n{submission.output}"

        # Attempt with Gemini if available
        if self.client:
            models_to_try = [
                os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite"),
                "gemini-3.5-flash-lite",
                "gemini-3.1-flash-lite",
            ]

            prompt = f"""
You are an expert university examiner conducting a technical viva voce for a student's laboratory experiment.
Based on the following lab submission, generate {num_questions} thoughtful viva questions that rigorously test the student's understanding of:
1. Core theoretical principles and purpose of the lab
2. Algorithmic logic, data structures, and edge cases in their code
3. Time and space complexity
4. Interpretation and verification of the observed outputs

Provide a clear, educational answer hint for each question.

Format as a strict JSON array of objects, each with "question" and "hint" keys.

Lab Submission:
{context_text}
"""
            for model_name in models_to_try:
                try:
                    logger.info("Generating viva questions with model %s", model_name)
                    response = self.client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                        ),
                    )
                    if response and response.text:
                        raw_text = response.text.strip()
                        # Clean markdown wrappers if any
                        if raw_text.startswith("```json"):
                            raw_text = raw_text[7:]
                        if raw_text.startswith("```"):
                            raw_text = raw_text[3:]
                        if raw_text.endswith("```"):
                            raw_text = raw_text[:-3]

                        questions_data = json.loads(raw_text.strip())
                        if isinstance(questions_data, list) and len(questions_data) > 0:
                            for q_data in questions_data[:num_questions]:
                                q = VivaQuestion(
                                    submission_id=submission.id,
                                    question_text=q_data.get("question", "").strip(),
                                    answer_hint=q_data.get("hint", "").strip(),
                                )
                                self.db.add(q)
                                created_questions.append(q)

                            await self.db.commit()
                            for q in created_questions:
                                await self.db.refresh(q)
                            logger.info("Successfully generated %d viva questions via Gemini (%s)", len(created_questions), model_name)
                            return created_questions
                except Exception as gemini_err:
                    logger.warning("Gemini generation failed on model %s: %s", model_name, gemini_err)

        # Fallback generator if Gemini is unavailable or failed
        logger.info("Using smart domain viva question generator fallback")
        fallback_data = self._generate_fallback_viva(submission, num_questions)
        for item in fallback_data:
            q = VivaQuestion(
                submission_id=submission.id,
                question_text=item["question"],
                answer_hint=item["hint"],
            )
            self.db.add(q)
            created_questions.append(q)

        await self.db.commit()
        for q in created_questions:
            await self.db.refresh(q)
        return created_questions

    def _generate_fallback_viva(self, submission: Submission, num_questions: int) -> list[dict[str, str]]:
        """Generate targeted viva questions and hints based on lab submission metadata."""
        aim = submission.aim or "the lab experiment"
        subject = submission.subject_of_lab or "Computer Science"
        code = submission.code or ""
        output = submission.output or ""

        # Detect patterns
        has_loops = "for " in code or "while " in code
        has_recursion = bool(re.search(r"def (\w+)\(.*\):[\s\S]*?\1\(", code))
        has_search = "search" in aim.lower() or "binary" in aim.lower() or "linear" in aim.lower()
        has_sort = "sort" in aim.lower() or "bubble" in aim.lower() or "quick" in aim.lower() or "merge" in aim.lower()

        candidates = [
            {
                "question": f"In the context of {subject}, what is the primary objective of this experiment ('{aim}'), and why is this approach chosen?",
                "hint": f"Discuss the core concept of {aim}. Explain how your implementation solves the defined problem systematically and what specific goal it accomplishes.",
            },
            {
                "question": "What is the worst-case and average-case time complexity of your implemented algorithm?",
                "hint": "Analyze the number of operations relative to input size n. Discuss whether nested iterations, recursive splits, or logarithmic step reductions dominate the runtime.",
            },
            {
                "question": "What auxiliary space complexity does your program require during execution?",
                "hint": "Identify additional arrays, dynamic allocations, or call stack frames consumed. State whether the solution is in-place (O(1) auxiliary) or requires additional memory.",
            },
            {
                "question": "How does your implementation handle edge cases such as empty inputs, negative values, or boundary conditions?",
                "hint": "Point to the guard clauses, loop exit conditions, or error handling mechanisms in your source code.",
            },
            {
                "question": "How do the observed outputs verify that the algorithm functioned correctly across test scenarios?",
                "hint": f"Reference the recorded output: '{output[:80]}...'. Correlate the given input variables with the output to prove correctness.",
            },
            {
                "question": "What alternative data structures or algorithmic paradigms could be applied to improve efficiency?",
                "hint": "Contrast your approach with alternatives (e.g., hash tables vs balanced trees, iterative vs recursive, or divide-and-conquer vs dynamic programming).",
            },
            {
                "question": "If the dataset scale increased by 1,000x, where would the primary performance bottleneck occur?",
                "hint": "Identify memory limits (cache misses, RAM allocation) and CPU bottlenecks (quadratic loops, deep recursion stack overflow).",
            },
        ]

        if has_sort:
            candidates.insert(1, {
                "question": "Is your sorting technique stable and in-place? Explain why stability matters in practical database systems.",
                "hint": "A stable sort preserves the relative order of equal keys. Discuss whether your swap or partitioning logic maintains this property.",
            })

        if has_search:
            candidates.insert(1, {
                "question": "What is the search space and condition in your search algorithm, and when does it terminate early?",
                "hint": "Analyze whether the search requires sorted elements (e.g. binary search O(log n)) or scans sequentially (linear search O(n)).",
            })

        if has_loops:
            candidates.insert(1, {
                "question": "Explain the termination condition and invariant for the loops used in your code.",
                "hint": "Trace how index variables or boundary conditions change on each iteration to guarantee termination.",
            })

        if has_recursion:
            candidates.insert(2, {
                "question": "Explain the base case of your recursive function and how stack frames are resolved upon completion.",
                "hint": "Identify the stopping condition that prevents infinite recursion and describe unwinding of values from the call stack.",
            })

        return candidates[:num_questions]

    async def chat_with_lab(
        self,
        submission: Submission,
        message: str,
        history: list[dict[str, str]],
    ) -> dict[str, Any]:
        """
        Interactive ChatGPT-like conversational Viva tutor & oral examiner based on the lab submission.
        Uses Gemini models with structured prompt & conversation history, with automatic fallback for high reliability.
        """
        aim = submission.aim or "Laboratory Experiment"
        subject = submission.subject_of_lab or "Computer Science"
        subject_code = submission.subject_code or "N/A"
        code_str = submission.code or ""
        output_str = submission.output or ""

        problems_details: list[str] = []
        try:
            parsed_code = json.loads(code_str)
            if isinstance(parsed_code, list):
                for idx, p in enumerate(parsed_code):
                    p_q = p.get("question", "").strip()
                    p_c = p.get("code", "").strip()
                    p_lang = p.get("language", "cpp")
                    p_out = p.get("output", "").strip()
                    problems_details.append(
                        f"### Problem {idx+1}:\n"
                        f"- **Aim / Question**: {p_q}\n"
                        f"- **Language**: {p_lang}\n"
                        f"- **Source Code**:\n```{p_lang}\n{p_c}\n```\n"
                        f"- **Observed Output**:\n```\n{p_out}\n```\n"
                    )
        except Exception:
            pass

        if problems_details:
            code_context = "\n\n".join(problems_details)
        else:
            code_context = f"Code:\n```\n{code_str}\n```\n\nOutput:\n```\n{output_str}\n```"

        system_instruction = f"""You are LabPilot AI — an elite university computer science professor, technical lab examiner, and personal viva voce coach.
You are conducting a live, interactive oral exam preparation and tutoring chat with an engineering student.

STUDENT'S SUBMITTED LAB REPORT CONTEXT:
- Subject: {subject} (Code: {subject_code})
- Experiment Aim / Topic: {aim}
- Lab Content & Problems:
{code_context}

INSTRUCTIONS FOR YOUR RESPONSES:
1. Provide thoughtful, well-structured, and technically precise answers just like ChatGPT.
2. When the student asks about time complexity, space complexity, data structures, algorithms, or viva questions, refer directly to their specific code and implementation above.
3. If the student asks you to quiz or test them, ask 1 or 2 focused viva questions and invite them to answer.
4. If the student answers your question, evaluate their response constructively, pointing out strengths and edge cases they missed.
5. Format your output with clean Markdown (bold headings, bullet points, syntax-highlighted code blocks).
6. Be encouraging, concise yet thorough, and end each response with a clear takeaway or logical follow-up question.
7. CRITICAL NOTATION RULE: Do NOT use LaTeX math formatting or dollar signs ($ or $$). Never write $v$, $u$, $2E$, $E$, $\\mathcal{{O}}(...)$, or $v \\rightarrow u$. Instead, write variables and math in clean plain text or code backticks: `v`, `u`, `2E`, `E`, `O(N log N)`, `v -> u`. Dollar signs must NEVER appear in your response.
"""

        # Attempt with Gemini
        if self.client:
            models_to_try = [
                os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite"),
                "gemini-3.5-flash-lite",
                "gemini-3.1-flash-lite",
            ]

            contents: list[types.Content] = []
            for h in history[-8:]:
                role = "user" if h.get("role") == "user" else "model"
                text = h.get("content", "").strip()
                if text:
                    contents.append(types.Content(role=role, parts=[types.Part.from_text(text=text)]))

            contents.append(types.Content(role="user", parts=[types.Part.from_text(text=message.strip())]))

            for model_name in models_to_try:
                try:
                    logger.info("Generating viva chat reply with model %s", model_name)
                    response = self.client.models.generate_content(
                        model=model_name,
                        contents=contents,
                        config=types.GenerateContentConfig(
                            system_instruction=system_instruction,
                            temperature=0.7,
                        ),
                    )
                    if response and response.text:
                        reply_text = response.text.strip()
                        suggested_prompts = self._generate_suggested_prompts(message, reply_text, aim)
                        return {
                            "reply": reply_text,
                            "suggested_prompts": suggested_prompts,
                        }
                except Exception as err:
                    logger.warning("Gemini chat failed on model %s: %s", model_name, err)

        # Fallback if Gemini unavailable or failed
        logger.info("Using smart domain fallback for viva chat response")
        fallback_reply = self._generate_fallback_chat_reply(submission, message)
        suggested_prompts = self._generate_suggested_prompts(message, fallback_reply, aim)
        return {
            "reply": fallback_reply,
            "suggested_prompts": suggested_prompts,
        }

    def _generate_suggested_prompts(self, query: str, reply: str, aim: str) -> list[str]:
        """Generate 3 contextual follow-up query suggestions."""
        q_lower = query.lower()
        if "complexity" in q_lower or "big-o" in q_lower or "runtime" in q_lower:
            return [
                "What is the auxiliary space complexity?",
                "Can this solution be further optimized?",
                "Quiz me with a viva question on this algorithm",
            ]
        elif "viva" in q_lower or "quiz" in q_lower or "question" in q_lower or "test" in q_lower:
            return [
                "Explain the answer to that viva question",
                "Ask me another viva question on this lab",
                "What edge cases could the examiner ask about?",
            ]
        elif "edge" in q_lower or "boundary" in q_lower or "error" in q_lower:
            return [
                "How would this code handle empty or negative inputs?",
                "What is the worst-case scenario for this program?",
                "Quiz me with an oral exam scenario",
            ]
        else:
            return [
                "What viva questions can my professor ask?",
                "Analyze the time & space complexity of my code",
                "Explain how my code works step by step",
            ]

    def _generate_fallback_chat_reply(self, submission: Submission, message: str) -> str:
        """Domain-aware intelligent Viva tutor response when Gemini is offline."""
        aim = submission.aim or "the lab experiment"
        subject = submission.subject_of_lab or "Computer Science"
        code = submission.code or ""
        output = submission.output or ""
        msg_lower = message.lower()

        # 1. Complexity query
        if any(w in msg_lower for w in ["complexity", "time complexity", "space complexity", "big-o", "big o", "runtime", "efficiency"]):
            has_nested = "for " in code and code.count("for ") >= 2
            has_single = "for " in code or "while " in code
            time_comp = "O(n²)" if has_nested else ("O(n)" if has_single else "O(1)")
            return f"""### ⏱️ Complexity Analysis for `{aim}`

Here is the technical complexity breakdown for your submission in **{subject}**:

1. **Time Complexity**:
   - **Worst-Case**: `{time_comp}` — determined by the primary loops and conditional branches in your logic.
   - **Average-Case**: `{time_comp}` — standard operational flow across typical input sizes.
   - **Best-Case**: `O(1)` or `O(n)` depending on early termination / break conditions.

2. **Auxiliary Space Complexity**:
   - `O(1)` auxiliary space if variables are modified in-place without auxiliary data structures.
   - If dynamic arrays or recursion stacks are used, space scales with depth `O(n)`.

**💡 Viva Examiner Tip:**
When asked in viva, clearly distinguish between *auxiliary space* (extra memory allocated) and *total space* (input memory + auxiliary memory).

Would you like me to test you on how this complexity changes if the input size scales to millions of elements?"""

        # 2. Quiz / Viva Questions query
        if any(w in msg_lower for w in ["viva", "quiz", "question", "ask me", "test me", "oral"]):
            return f"""### 🎓 Viva Voce Practice Questions for `{aim}`

Here are 3 core questions your professor or external examiner is most likely to ask regarding this experiment:

1. **Question 1 (Core Theory)**:
   > *What is the primary objective of '{aim}', and why is this specific algorithmic approach preferred over alternatives?*
   - **Key Concept**: Explain the trade-offs between simplicity, execution speed, and memory usage.

2. **Question 2 (Implementation & Edge Cases)**:
   > *How does your implementation handle extreme inputs (such as an empty dataset, duplicates, or out-of-bound values)?*
   - **Key Concept**: Reference the guard clauses or loop termination checks in your code.

3. **Question 3 (Verification & Output)**:
   > *How do your observed outputs (`{output[:60]}...`) demonstrate that the algorithm completed without logical errors?*
   - **Key Concept**: Walk the examiner through one test case trace.

**Ready to practice?** Try answering **Question 1**, and I will evaluate your response!"""

        # 3. Edge cases query
        if any(w in msg_lower for w in ["edge", "boundary", "cases", "corner", "bugs", "failure"]):
            return f"""### 🛡️ Critical Edge Cases to Prepare For

For **{aim}**, examiners often probe how robust your code is against non-ideal conditions:

- **Empty / Null Input**: Does your code check if the collection or array size is `0` before accessing indices?
- **Single Element**: Does the algorithm behave correctly when `n = 1` without infinite loops?
- **Boundary Values & Overflow**: Are data types (e.g. `int` vs `long long`) sufficient to prevent integer overflow during calculations?
- **Duplicate Elements**: If elements are identical, does your comparison logic remain stable?

**💡 Pro Tip:**
Mentioning these edge cases unprompted during your oral exam demonstrates seniority and practical engineering acumen!"""

        # 4. Default / General conversation
        return f"""### 🧪 Viva Preparation Assistant — `{aim}`

I have analyzed your submitted lab record for **{subject}** (Aim: *{aim}*).

Here is a quick snapshot of what examiners will evaluate:
- **Foundational Concepts**: Understanding why this algorithm or data structure was selected.
- **Code Execution Flow**: Being able to dry-run your source code line-by-line on a whiteboard.
- **Output Validation**: Explaining how the recorded outputs match the expected theoretical results.

**How would you like to prepare right now?**
- Ask: *"What viva questions can my professor ask?"*
- Ask: *"Analyze the time and space complexity of my code"*
- Ask: *"Quiz me with an oral exam question"*
- Ask: *"Explain how my code works line by line"*"""
