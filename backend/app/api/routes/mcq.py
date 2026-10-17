import logging
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db
from app.models import MCQAttempt, MCQQuestion, MCQTest, Submission, User
from app.schemas import (
    MCQAttemptResponse,
    MCQAttemptSummary,
    MCQQuestionPublic,
    MCQQuestionResult,
    MCQSubmitRequest,
    MCQTestCreateRequest,
    MCQTestResponse,
)
from app.services.mcq_service import MCQService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["mcq"])


@router.post(
    "/submissions/{submission_id}/mcq/generate",
    response_model=MCQTestResponse,
    status_code=status.HTTP_201_CREATED,
)
async def generate_mcq_test(
    submission_id: UUID,
    body: MCQTestCreateRequest = MCQTestCreateRequest(num_questions=10),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Generate a new MCQ test based on the student's submission.
    Guarantees different questions every time by excluding previously generated questions.
    """
    submission = await db.get(Submission, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    if submission.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this submission")

    num_q = max(10, min(15, body.num_questions))
    service = MCQService(db)

    try:
        test = await service.generate_mcq_test(
            submission=submission,
            user_id=current_user.id,
            num_questions=num_q,
        )
    except Exception as e:
        logger.exception("Failed to generate MCQ test for submission %s", submission_id)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate MCQ test: {str(e)}",
        )

    # Convert questions to public schema (hiding answers)
    public_questions = [
        MCQQuestionPublic(
            id=q.id,
            order_index=q.order_index,
            question_text=q.question_text,
            options=q.options,
            difficulty=q.difficulty,
            concept=q.concept,
        )
        for q in sorted(test.questions, key=lambda x: x.order_index)
    ]

    return MCQTestResponse(
        id=test.id,
        submission_id=test.submission_id,
        title=test.title,
        topic=test.topic,
        total_questions=test.total_questions,
        created_at=test.created_at,
        questions=public_questions,
        attempts_count=0,
    )


@router.get(
    "/submissions/{submission_id}/mcq/tests",
    response_model=list[MCQTestResponse],
)
async def list_submission_tests(
    submission_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """List all MCQ tests generated for a submission."""
    submission = await db.get(Submission, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    if submission.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this submission")

    stmt = (
        select(MCQTest)
        .where(MCQTest.submission_id == submission_id)
        .options(selectinload(MCQTest.questions), selectinload(MCQTest.attempts))
        .order_by(MCQTest.created_at.desc())
    )
    result = await db.execute(stmt)
    tests = result.scalars().all()

    response: list[MCQTestResponse] = []
    for t in tests:
        public_questions = [
            MCQQuestionPublic(
                id=q.id,
                order_index=q.order_index,
                question_text=q.question_text,
                options=q.options,
                difficulty=q.difficulty,
                concept=q.concept,
            )
            for q in sorted(t.questions, key=lambda x: x.order_index)
        ]
        response.append(
            MCQTestResponse(
                id=t.id,
                submission_id=t.submission_id,
                title=t.title,
                topic=t.topic,
                total_questions=t.total_questions,
                created_at=t.created_at,
                questions=public_questions,
                attempts_count=len(t.attempts),
            )
        )
    return response


@router.get(
    "/mcq/tests/{test_id}",
    response_model=MCQTestResponse,
)
async def get_mcq_test(
    test_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get a specific MCQ test with its questions (answers hidden)."""
    stmt = (
        select(MCQTest)
        .where(MCQTest.id == test_id)
        .options(selectinload(MCQTest.questions), selectinload(MCQTest.attempts))
    )
    result = await db.execute(stmt)
    test = result.scalar_one_or_none()
    if not test:
        raise HTTPException(status_code=404, detail="MCQ Test not found")

    public_questions = [
        MCQQuestionPublic(
            id=q.id,
            order_index=q.order_index,
            question_text=q.question_text,
            options=q.options,
            difficulty=q.difficulty,
            concept=q.concept,
        )
        for q in sorted(test.questions, key=lambda x: x.order_index)
    ]

    return MCQTestResponse(
        id=test.id,
        submission_id=test.submission_id,
        title=test.title,
        topic=test.topic,
        total_questions=test.total_questions,
        created_at=test.created_at,
        questions=public_questions,
        attempts_count=len(test.attempts),
    )


@router.delete(
    "/mcq/tests/{test_id}",
    status_code=204,
)
async def delete_mcq_test(
    test_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete an MCQ test and its questions/attempts."""
    stmt = (
        select(MCQTest)
        .join(Submission, MCQTest.submission_id == Submission.id)
        .where(MCQTest.id == test_id, Submission.user_id == current_user.id)
    )
    result = await db.execute(stmt)
    test = result.scalar_one_or_none()
    if not test:
        raise HTTPException(status_code=404, detail="MCQ Test not found or unauthorized")

    await db.execute(delete(MCQAttempt).where(MCQAttempt.test_id == test_id))
    await db.execute(delete(MCQQuestion).where(MCQQuestion.test_id == test_id))
    await db.delete(test)
    await db.commit()


@router.post(
    "/mcq/tests/{test_id}/submit",
    response_model=MCQAttemptResponse,
)
async def submit_mcq_test(
    test_id: UUID,
    body: MCQSubmitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Submit test answers, grade on the spot, evaluate student level on the topic,
    and return complete question-by-question review and feedback.
    """
    service = MCQService(db)
    try:
        attempt = await service.grade_mcq_test(
            test_id=test_id,
            user_id=current_user.id,
            selected_answers=body.selected_answers,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.exception("Error grading MCQ test %s", test_id)
        raise HTTPException(status_code=500, detail=f"Failed to grade test: {str(e)}")

    # Fetch test questions to construct comprehensive review
    stmt = (
        select(MCQQuestion)
        .where(MCQQuestion.test_id == test_id)
        .order_by(MCQQuestion.order_index)
    )
    q_result = await db.execute(stmt)
    questions = q_result.scalars().all()

    result_questions: list[MCQQuestionResult] = []
    for q in questions:
        selected_opt = body.selected_answers.get(str(q.id))
        is_corr = (selected_opt is not None) and (selected_opt == q.correct_index)
        result_questions.append(
            MCQQuestionResult(
                id=q.id,
                order_index=q.order_index,
                question_text=q.question_text,
                options=q.options,
                selected_index=selected_opt,
                correct_index=q.correct_index,
                is_correct=is_corr,
                explanation=q.explanation,
                difficulty=q.difficulty,
                concept=q.concept,
            )
        )

    return MCQAttemptResponse(
        id=attempt.id,
        test_id=attempt.test_id,
        score=attempt.score,
        total_questions=attempt.total_questions,
        percentage=attempt.percentage,
        level=attempt.level,
        feedback=attempt.feedback,
        analysis=attempt.analysis,
        questions=result_questions,
        created_at=attempt.created_at,
    )


@router.get(
    "/mcq/tests/{test_id}/attempts",
    response_model=list[MCQAttemptSummary],
)
async def list_test_attempts(
    test_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """List past attempts for a specific MCQ test."""
    stmt = (
        select(MCQAttempt)
        .where(MCQAttempt.test_id == test_id)
        .order_by(MCQAttempt.created_at.desc())
    )
    result = await db.execute(stmt)
    attempts = result.scalars().all()
    return attempts


@router.get(
    "/mcq/attempts/{attempt_id}",
    response_model=MCQAttemptResponse,
)
async def get_attempt_details(
    attempt_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get complete question breakdown and review for a specific past attempt."""
    attempt = await db.get(MCQAttempt, attempt_id)
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    stmt = (
        select(MCQQuestion)
        .where(MCQQuestion.test_id == attempt.test_id)
        .order_by(MCQQuestion.order_index)
    )
    q_result = await db.execute(stmt)
    questions = q_result.scalars().all()

    selected_answers = attempt.selected_answers or {}
    result_questions: list[MCQQuestionResult] = []
    for q in questions:
        selected_opt = selected_answers.get(str(q.id))
        is_corr = (selected_opt is not None) and (selected_opt == q.correct_index)
        result_questions.append(
            MCQQuestionResult(
                id=q.id,
                order_index=q.order_index,
                question_text=q.question_text,
                options=q.options,
                selected_index=selected_opt,
                correct_index=q.correct_index,
                is_correct=is_corr,
                explanation=q.explanation,
                difficulty=q.difficulty,
                concept=q.concept,
            )
        )

    return MCQAttemptResponse(
        id=attempt.id,
        test_id=attempt.test_id,
        score=attempt.score,
        total_questions=attempt.total_questions,
        percentage=attempt.percentage,
        level=attempt.level,
        feedback=attempt.feedback,
        analysis=attempt.analysis,
        questions=result_questions,
        created_at=attempt.created_at,
    )


@router.delete("/mcq/tests/{test_id}", status_code=204)
async def delete_mcq_test(
    test_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete an MCQ test and all associated questions and attempts."""
    test = await db.get(MCQTest, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="MCQ Test not found")
    if test.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this test")

    # Delete attempts, questions, and test
    await db.execute(delete(MCQAttempt).where(MCQAttempt.test_id == test_id))
    await db.execute(delete(MCQQuestion).where(MCQQuestion.test_id == test_id))
    await db.delete(test)
    await db.commit()

