import asyncio
import logging
from uuid import UUID

from app.core.database import AsyncSessionLocal
from app.models import Submission
from app.services.pdf_service import generate_pdf
from app.services.storage_service import storage_service
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


async def async_process_pdf(submission_id_str: str) -> None:
    submission_id = UUID(submission_id_str)
    
    async with AsyncSessionLocal() as db:
        submission = await db.get(Submission, submission_id)
        if not submission:
            logger.error("Submission %s not found in worker.", submission_id)
            return

        submission.status = "processing"
        await db.commit()

        try:
            # We need the template_name
            await db.refresh(submission, ["template", "user"])
            template_name = submission.template.layout_config.get("template_file", "nit_jalandhar_default.html")

            # 1. Generate PDF locally
            pdf_path = generate_pdf(
                submission_id=submission.id,
                aim=submission.aim,
                algorithm=submission.algorithm,
                code=submission.code,
                output=submission.output,
                result=submission.result,
                template_name=template_name,
                metadata={
                    "user_name": submission.user.name,
                    "college": submission.user.college,
                    "college_logo": submission.user.college_logo if (getattr(submission, 'include_logo', True) is not False) else None,
                    "include_logo": getattr(submission, 'include_logo', True) is not False,
                    "roll_number": submission.user.roll_number,
                    "date_of_lab": submission.date_of_lab,
                    "subject_of_lab": submission.subject_of_lab,
                    "subject_code": submission.subject_code,
                    "group": submission.group_name,
                    "batch": submission.batch_name,
                    "teacher_name": submission.teacher_name
                }
            )

            # 2. Upload to S3 (or mock local URI)
            object_name = f"submissions/{submission.id}.pdf"
            s3_uri = storage_service.upload_pdf(pdf_path, object_name)

            # 3. Index for RAG
            try:
                from app.services.rag_service import RAGService
                rag = RAGService(db)
                await rag.index_submission_pdf(submission, pdf_path)
            except Exception:
                logger.exception("Failed to index PDF for %s, continuing...", submission_id)

            # 4. Update status
            submission.pdf_url = s3_uri  # We will change our download endpoint to redirect to this or serve it
            submission.status = "ready"
            await db.commit()
            logger.info("Successfully generated and uploaded PDF for %s", submission_id)
            
        except Exception:
            logger.exception("Failed to generate PDF for %s", submission_id)
            submission.status = "failed"
            await db.commit()


import sys

@celery_app.task
def process_submission_pdf(submission_id_str: str) -> None:
    """
    Celery task to generate PDF asynchronously.
    """
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(async_process_pdf(submission_id_str))
