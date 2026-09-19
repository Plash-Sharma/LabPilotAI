from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel


class TemplateBase(BaseModel):
    name: str
    college_scope: str
    layout_config: dict[str, Any]

class TemplateCreate(TemplateBase):
    pass

class TemplateResponse(TemplateBase):
    id: UUID
    class Config:
        from_attributes = True

class LabSessionBase(BaseModel):
    subject: str
    semester: str

class LabSessionCreate(LabSessionBase):
    user_id: UUID

class LabSessionResponse(LabSessionBase):
    id: UUID
    user_id: UUID
    class Config:
        from_attributes = True

class SubmissionBase(BaseModel):
    aim: str
    algorithm: str
    code: str
    output: str
    result: str
    template_id: UUID
    lab_session_id: Optional[UUID] = None
    filename: Optional[str] = None
    date_of_lab: Optional[str] = None
    subject_of_lab: Optional[str] = None
    subject_code: Optional[str] = None
    group_name: Optional[str] = None
    batch_name: Optional[str] = None
    teacher_name: Optional[str] = None

class SubmissionCreate(SubmissionBase):
    pass

class SubmissionResponse(SubmissionBase):
    id: UUID
    status: str
    pdf_url: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

class VivaQuestionResponse(BaseModel):
    id: UUID
    submission_id: UUID
    question_text: str
    answer_hint: Optional[str] = None
    class Config:
        from_attributes = True
