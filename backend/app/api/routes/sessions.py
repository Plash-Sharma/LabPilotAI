from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models import LabSession
from app.schemas import LabSessionCreate, LabSessionResponse

router = APIRouter(prefix="/sessions", tags=["sessions"])


from app.api.deps import get_current_user
from app.models import User


@router.post("", response_model=LabSessionResponse, status_code=201)
async def create_session(
    body: LabSessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a new lab session (subject/semester grouping)."""
    data = body.model_dump()
    data['user_id'] = current_user.id
    session = LabSession(**data)
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.get("/{session_id}", response_model=LabSessionResponse)
async def get_session(session_id: UUID, db: AsyncSession = Depends(get_db)) -> Any:
    session = await db.get(LabSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.get("", response_model=list[LabSessionResponse])
async def list_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """List all sessions for the current user."""
    stmt = select(LabSession).where(LabSession.user_id == current_user.id)
    result = await db.execute(stmt)
    return result.scalars().all()

from fastapi.responses import FileResponse

@router.get("/{session_id}/merge")
async def merge_session_pdfs(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> FileResponse:
    """Merge all ready PDFs in a session and return the binder."""
    session = await db.get(LabSession, session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")
        
    await db.refresh(session, ["submissions"])
    
    # We only merge local files for now (Phase 4). If using S3, we'd download them first.
    from app.services.merge_service import merge_pdfs
    from pathlib import Path
    
    storage_dir = Path(__file__).parent.parent.parent.parent / "storage"
    pdf_paths = []
    
    # Sort submissions by creation time
    sorted_subs = sorted(session.submissions, key=lambda x: x.created_at)
    
    for sub in sorted_subs:
        if sub.status == "ready":
            pdf_path = storage_dir / f"{sub.id}.pdf"
            if pdf_path.exists():
                pdf_paths.append(str(pdf_path))
                
    if not pdf_paths:
        raise HTTPException(status_code=400, detail="No ready PDFs found to merge")
        
    output_path = storage_dir / f"binder_{session_id}.pdf"
    merge_pdfs(pdf_paths, str(output_path))
    
    return FileResponse(
        path=str(output_path),
        media_type="application/pdf",
        filename=f"{session.subject}_Binder.pdf"
    )
