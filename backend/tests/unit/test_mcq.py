import uuid

import pytest

from app.models import MCQQuestion, MCQTest, Submission
from app.services.mcq_service import MCQService


def test_mcq_fallback_generation():
    """Verify fallback generator generates between 10 and 15 unique MCQs with 4 options each."""
    submission = Submission(
        id=uuid.uuid4(),
        aim="Implement singly linked list insertion and deletion",
        code="class Node { int data; Node* next; };",
        output="10 -> 20 -> 30 -> NULL",
        subject_of_lab="Data Structures Lab",
    )

    service = MCQService(db=None)  # db not needed for pure fallback generator
    questions = service._generate_fallback_questions(
        submission=submission,
        num_needed=12,
        existing_texts=[],
    )

    assert len(questions) == 12
    for q in questions:
        assert len(q["options"]) == 4
        assert 0 <= q["correct_index"] <= 3
        assert len(q["question"]) > 5
        assert len(q["explanation"]) > 5
        assert q["difficulty"] in ["easy", "medium", "hard"]
        assert len(q["concept"]) > 0


def test_mcq_anti_duplication():
    """Ensure previously existing questions are filtered out to guarantee new questions."""
    submission = Submission(
        id=uuid.uuid4(),
        aim="Implement singly linked list",
        code="Node* head;",
        output="OK",
        subject_of_lab="Data Structures Lab",
    )

    service = MCQService(db=None)
    first_batch = service._generate_fallback_questions(
        submission=submission,
        num_needed=5,
        existing_texts=[],
    )
    assert len(first_batch) == 5
    first_texts = [q["question"] for q in first_batch]

    # Second batch should avoid repeating first_texts
    second_batch = service._generate_fallback_questions(
        submission=submission,
        num_needed=5,
        existing_texts=first_texts,
    )
    assert len(second_batch) == 5
    second_texts = [q["question"] for q in second_batch]

    # None of the second texts should be in the first texts
    overlap = set(first_texts).intersection(set(second_texts))
    assert len(overlap) == 0, f"Found overlapping questions: {overlap}"


@pytest.mark.asyncio
async def test_mcq_grading_levels():
    """Verify on the spot scoring and student level calculation for various scores."""
    # Test grading logic directly
    test_id = uuid.uuid4()
    user_id = uuid.uuid4()

    q1 = MCQQuestion(
        id=uuid.uuid4(),
        test_id=test_id,
        order_index=1,
        question_text="Q1",
        options=["A", "B", "C", "D"],
        correct_index=0,
        explanation="Exp 1",
        difficulty="easy",
        concept="Pointers",
    )
    q2 = MCQQuestion(
        id=uuid.uuid4(),
        test_id=test_id,
        order_index=2,
        question_text="Q2",
        options=["A", "B", "C", "D"],
        correct_index=1,
        explanation="Exp 2",
        difficulty="medium",
        concept="Memory",
    )

    class MockAsyncSession:
        def __init__(self, test_obj):
            self.test_obj = test_obj
            self.added = []

        async def execute(self, stmt):
            class MockResult:
                def __init__(self, obj):
                    self.obj = obj
                def scalar_one_or_none(self):
                    return self.obj
            return MockResult(self.test_obj)

        def add(self, entity):
            self.added.append(entity)

        async def commit(self):
            pass

        async def refresh(self, entity):
            pass

    test_obj = MCQTest(
        id=test_id,
        submission_id=uuid.uuid4(),
        user_id=user_id,
        title="Test Lab",
        total_questions=2,
    )
    test_obj.questions = [q1, q2]

    # Case 1: 100% (2/2) -> Mastery
    mock_db = MockAsyncSession(test_obj)
    service = MCQService(db=mock_db)
    attempt = await service.grade_mcq_test(
        test_id=test_id,
        user_id=user_id,
        selected_answers={str(q1.id): 0, str(q2.id): 1},
    )
    assert attempt.score == 2
    assert attempt.percentage == 100.0
    assert "Mastery" in attempt.level

    # Case 2: 50% (1/2) -> Intermediate
    mock_db2 = MockAsyncSession(test_obj)
    service2 = MCQService(db=mock_db2)
    attempt2 = await service2.grade_mcq_test(
        test_id=test_id,
        user_id=user_id,
        selected_answers={str(q1.id): 0, str(q2.id): 3},
    )
    assert attempt2.score == 1
    assert attempt2.percentage == 50.0
    assert "Intermediate" in attempt2.level

    # Case 3: 0% (0/2) -> Beginner
    mock_db3 = MockAsyncSession(test_obj)
    service3 = MCQService(db=mock_db3)
    attempt3 = await service3.grade_mcq_test(
        test_id=test_id,
        user_id=user_id,
        selected_answers={str(q1.id): 3, str(q2.id): 3},
    )
    assert attempt3.score == 0
    assert attempt3.percentage == 0.0
    assert "Beginner" in attempt3.level
