import json
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Any
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models import Submission, Template, User, MCQTest, MCQAttempt, MCQQuestion, VivaQuestion
from app.schemas import SubmissionCreate, SubmissionResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/submissions", tags=["submissions"])


@router.post("", response_model=SubmissionResponse, status_code=201)
async def create_submission(
    body: SubmissionCreate, 
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Submit a lab experiment.
    Generates PDF asynchronously via Celery (if configured) or FastAPI BackgroundTasks (for free single-instance hosting).
    Enforces unique filename per user and extracts actual aim from problem statements.
    """
    # 1. Verify template exists
    template = await db.get(Template, body.template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # 2. Filename validation and uniqueness enforcement per user
    cleaned_filename = (body.filename or "").strip()
    if not cleaned_filename:
        base_name = (body.subject_of_lab or "lab-report").strip().lower().replace(" ", "-")
        cleaned_filename = f"{base_name}-{int(datetime.utcnow().timestamp())}"

    dup_stmt = select(Submission).where(
        Submission.user_id == current_user.id,
        func.lower(Submission.filename) == cleaned_filename.lower(),
    )
    dup_sub = (await db.execute(dup_stmt)).scalars().first()
    if dup_sub:
        raise HTTPException(
            status_code=400,
            detail=f"A lab file named '{cleaned_filename}' already exists. Please choose a unique file name."
        )

    # 3. Compute real Aim from problem statements instead of placeholder 'MULTI_PROBLEM'
    aim_text = (body.aim or "").strip()
    if aim_text == "MULTI_PROBLEM" or not aim_text:
        try:
            probs = json.loads(body.code)
            if isinstance(probs, list) and probs:
                q_list = [p.get("question", "").strip() for p in probs if p.get("question", "").strip()]
                if q_list:
                    aim_text = " | ".join(q_list[:3])
        except Exception:
            pass
    if not aim_text or aim_text == "MULTI_PROBLEM":
        aim_text = f"{body.subject_of_lab or 'Lab'} Practical"

    submission = Submission(
        user_id=current_user.id,
        lab_session_id=body.lab_session_id,
        template_id=body.template_id,
        aim=aim_text,
        algorithm=body.algorithm,
        code=body.code,
        output=body.output,
        result=body.result,
        filename=cleaned_filename,
        date_of_lab=body.date_of_lab,
        subject_of_lab=body.subject_of_lab,
        subject_code=body.subject_code,
        group_name=body.group_name,
        batch_name=body.batch_name,
        teacher_name=body.teacher_name,
        include_logo=body.include_logo if body.include_logo is not None else True,
        status="processing",
    )
    db.add(submission)
    await db.commit()
    await db.refresh(submission)

    # Async PDF generation: Celery if configured/running, with BackgroundTasks fallback
    use_celery = os.getenv("USE_CELERY", "false").lower() in ("true", "1")
    dispatched = False
    if use_celery and os.getenv("REDIS_URL"):
        try:
            from app.workers.pdf_worker import process_submission_pdf
            process_submission_pdf.delay(str(submission.id))
            dispatched = True
        except Exception as e:
            logger.warning("Celery dispatch failed: %s. Using background task fallback.", e)

    if not dispatched:
        from app.workers.pdf_worker import async_process_pdf
        background_tasks.add_task(async_process_pdf, str(submission.id))

    await db.commit()
    await db.refresh(submission)
    return submission


@router.get("", response_model=list[SubmissionResponse])
async def list_submissions(
    session_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    stmt = select(Submission).where(Submission.user_id == current_user.id)
    if session_id:
        stmt = stmt.where(Submission.lab_session_id == session_id)
    stmt = stmt.order_by(Submission.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{submission_id}", response_model=SubmissionResponse)
async def get_submission(
    submission_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    submission = await db.get(Submission, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    if submission.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this submission")
    return submission


@router.delete("/{submission_id}", status_code=204)
async def delete_submission(
    submission_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    submission = await db.get(Submission, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    if submission.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this submission")

    # 1. Remove local PDF file from storage
    from app.services.pdf_service import STORAGE_DIR
    pdf_path = STORAGE_DIR / f"{submission_id}.pdf"
    if pdf_path.exists():
        try:
            pdf_path.unlink()
        except Exception as e:
            logger.warning("Could not unlink pdf %s: %s", pdf_path, e)

    # 2. Delete associated MCQ attempts, questions, and tests
    test_stmt = select(MCQTest.id).where(MCQTest.submission_id == submission_id)
    test_ids = (await db.execute(test_stmt)).scalars().all()
    if test_ids:
        await db.execute(delete(MCQAttempt).where(MCQAttempt.test_id.in_(test_ids)))
        await db.execute(delete(MCQQuestion).where(MCQQuestion.test_id.in_(test_ids)))
        await db.execute(delete(MCQTest).where(MCQTest.id.in_(test_ids)))

    # 3. Delete viva questions
    await db.execute(delete(VivaQuestion).where(VivaQuestion.submission_id == submission_id))

    # 4. Delete document chunks (RAG)
    try:
        from app.models import DocumentChunk
        await db.execute(delete(DocumentChunk).where(DocumentChunk.submission_id == submission_id))
    except Exception as e:
        logger.warning("Could not delete document chunks for %s: %s", submission_id, e)

    # 5. Delete submission record
    await db.delete(submission)
    await db.commit()


import urllib.parse
from fastapi.responses import RedirectResponse, Response


def _build_pdf_response(submission: Submission, pdf_path: Path, disposition: str = "attachment") -> Response:
    raw_name = (submission.filename or f"lab-report-{submission.id}").strip()
    # Sanitize filename for headers
    base_name = raw_name.replace("/", "-").replace("\\", "-").replace('"', "").replace("'", "")
    if not base_name.lower().endswith(".pdf"):
        base_name += ".pdf"

    safe_ascii = urllib.parse.quote(base_name)
    content_disp = f'{disposition}; filename="{base_name}"; filename*=UTF-8\'\'{safe_ascii}'

    return FileResponse(
        path=str(pdf_path),
        media_type="application/pdf",
        content_disposition_type=disposition,
        headers={
            "Content-Disposition": content_disp,
            "Content-Type": "application/pdf",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
        },
        filename=base_name,
    )


@router.get("/{submission_id}/download")
@router.get("/{submission_id}/download/{filename}")
async def download_pdf(
    submission_id: UUID, 
    filename: str | None = None,
    db: AsyncSession = Depends(get_db)
) -> Any:
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

    return _build_pdf_response(submission, pdf_path, disposition="attachment")


@router.get("/{submission_id}/view")
@router.get("/{submission_id}/view/{filename}")
async def view_pdf(
    submission_id: UUID, 
    filename: str | None = None,
    db: AsyncSession = Depends(get_db)
) -> Any:
    submission = await db.get(Submission, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    if submission.status != "ready":
        raise HTTPException(status_code=400, detail=f"PDF not ready — status: {submission.status}")

    if submission.pdf_url and submission.pdf_url.startswith("s3://"):
        from app.services.storage_service import storage_service
        url = storage_service.get_presigned_url(submission.pdf_url)
        return RedirectResponse(url)

    from app.services.pdf_service import STORAGE_DIR
    pdf_path = STORAGE_DIR / f"{submission_id}.pdf"

    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="PDF file not found on disk")

    return _build_pdf_response(submission, pdf_path, disposition="inline")

