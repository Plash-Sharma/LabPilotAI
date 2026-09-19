import logging
from pathlib import Path
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models import Submission, Template, User
from app.schemas import SubmissionCreate, SubmissionResponse
from app.api.deps import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/submissions", tags=["submissions"])


@router.post("", response_model=SubmissionResponse, status_code=201)
async def create_submission(
    body: SubmissionCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Submit a lab experiment. Phase 1: synchronous PDF generation.
    The PDF is generated inline before returning the response.
    """
    # Verify template exists
    template = await db.get(Template, body.template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    submission = Submission(
        user_id=current_user.id,
        lab_session_id=body.lab_session_id,
        template_id=body.template_id,
        aim=body.aim,
        algorithm=body.algorithm,
        code=body.code,
        output=body.output,
        result=body.result,
        filename=body.filename,
        date_of_lab=body.date_of_lab,
        subject_of_lab=body.subject_of_lab,
        subject_code=body.subject_code,
        group_name=body.group_name,
        batch_name=body.batch_name,
        teacher_name=body.teacher_name,
        status="processing",
    )
    db.add(submission)
    await db.commit()
    await db.refresh(submission)

    # Async PDF generation via Celery (Phase 2)
    from app.workers.pdf_worker import process_submission_pdf

    process_submission_pdf.delay(str(submission.id))

    await db.commit()
    await db.refresh(submission)
    return submission


@router.get("", response_model=list[SubmissionResponse])
async def list_submissions(session_id: UUID | None = None, db: AsyncSession = Depends(get_db)) -> Any:
    stmt = select(Submission)
    if session_id:
        stmt = stmt.where(Submission.lab_session_id == session_id)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{submission_id}", response_model=SubmissionResponse)
async def get_submission(submission_id: UUID, db: AsyncSession = Depends(get_db)) -> Any:
    submission = await db.get(Submission, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    return submission


from fastapi.responses import RedirectResponse


@router.get("/{submission_id}/download")
async def download_pdf(submission_id: UUID, db: AsyncSession = Depends(get_db)) -> Any:
    submission = await db.get(Submission, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    if submission.status != "ready":
        raise HTTPException(status_code=400, detail=f"PDF not ready — status: {submission.status}")

    # Handle S3 URL
    if submission.pdf_url and submission.pdf_url.startswith("s3://"):
        from app.services.storage_service import storage_service
        url = storage_service.get_presigned_url(submission.pdf_url)
        return RedirectResponse(url)

    # Local fallback
    from app.services.pdf_service import STORAGE_DIR
    pdf_path = STORAGE_DIR / f"{submission_id}.pdf"

    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="PDF file not found on disk")

    download_filename = submission.filename
    if not download_filename:
        download_filename = f"lab-report-{submission_id}"
    if not download_filename.endswith(".pdf"):
        download_filename += ".pdf"

    return FileResponse(
        path=str(pdf_path),
        media_type="application/pdf",
        filename=download_filename,
    )
