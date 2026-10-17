from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models import Submission, User, VivaQuestion
from app.schemas.schemas import VivaChatRequest, VivaChatResponse, VivaQuestionResponse

router = APIRouter(prefix="/submissions", tags=["rag"])

@router.post("/{submission_id}/generate-questions", response_model=list[VivaQuestionResponse])
async def generate_questions(
    submission_id: UUID, 
    num_questions: int = 5,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Generate Viva Questions for a specific submission via Gemini RAG."""
    submission = await db.get(Submission, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    if submission.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this submission")
        
    if submission.status != "ready":
        raise HTTPException(status_code=400, detail="Submission PDF not ready yet")

    from app.services.rag_service import RAGService
    rag = RAGService(db)
    
    # Check if we already have questions
    stmt = select(VivaQuestion).where(VivaQuestion.submission_id == submission_id)
    existing = (await db.execute(stmt)).scalars().all()
    if existing:
        return existing

    questions = await rag.generate_viva_questions(submission, num_questions)
    if not questions:
        raise HTTPException(status_code=500, detail="Failed to generate questions. Is Gemini API configured?")
        
    return questions

@router.get("/{submission_id}/questions", response_model=list[VivaQuestionResponse])
async def get_questions(
    submission_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get previously generated Viva Questions for a submission."""
    submission = await db.get(Submission, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    if submission.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this submission")

    stmt = select(VivaQuestion).where(VivaQuestion.submission_id == submission_id)
    questions = (await db.execute(stmt)).scalars().all()
    return questions


@router.post("/{submission_id}/chat", response_model=VivaChatResponse)
async def chat_with_lab(
    submission_id: UUID,
    body: VivaChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """ChatGPT-like interactive Viva prep and exam practice conversation."""
    submission = await db.get(Submission, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    if submission.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this submission")

    from app.services.rag_service import RAGService
    rag = RAGService(db)
    result = await rag.chat_with_lab(
        submission=submission,
        message=body.message,
        history=[m.model_dump() for m in body.history],
    )
    return result
