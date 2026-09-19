from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models import Template
from app.schemas import TemplateCreate, TemplateResponse

router = APIRouter(prefix="/templates", tags=["templates"])


@router.get("", response_model=list[TemplateResponse])
async def list_templates(db: AsyncSession = Depends(get_db)) -> Any:
    """List all available report templates."""
    result = await db.execute(select(Template))
    return result.scalars().all()


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(template_id: UUID, db: AsyncSession = Depends(get_db)) -> Any:
    template = await db.get(Template, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.post("", response_model=TemplateResponse, status_code=201)
async def create_template(body: TemplateCreate, db: AsyncSession = Depends(get_db)) -> Any:
    """Admin: create a new report template."""
    template = Template(**body.model_dump())
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return template
