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
    include_logo: Optional[bool] = True

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


class MCQQuestionPublic(BaseModel):
    id: UUID
    order_index: int
    question_text: str
    options: list[str]
    difficulty: str
    concept: str
    class Config:
        from_attributes = True


class MCQTestCreateRequest(BaseModel):
    num_questions: int = 10  # 10 to 15


class MCQTestResponse(BaseModel):
    id: UUID
    submission_id: UUID
    title: str
    topic: Optional[str] = None
    total_questions: int
    created_at: datetime
    questions: list[MCQQuestionPublic] = []
    attempts_count: int = 0
    class Config:
        from_attributes = True


class MCQSubmitRequest(BaseModel):
    selected_answers: dict[str, int]  # question_id_str -> option_index (0..3)


class MCQQuestionResult(BaseModel):
    id: UUID
    order_index: int
    question_text: str
    options: list[str]
    selected_index: Optional[int] = None
    correct_index: int
    is_correct: bool
    explanation: str
    difficulty: str
    concept: str


class MCQAttemptResponse(BaseModel):
    id: UUID
    test_id: UUID
    score: int
    total_questions: int
    percentage: float
    level: str
    feedback: str
    analysis: dict[str, Any]
    questions: list[MCQQuestionResult] = []
    created_at: datetime
    class Config:
        from_attributes = True


class MCQAttemptSummary(BaseModel):
    id: UUID
    test_id: UUID
    score: int
    total_questions: int
    percentage: float
    level: str
    created_at: datetime
    class Config:
        from_attributes = True


class VivaChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class VivaChatRequest(BaseModel):
    message: str
    history: list[VivaChatMessage] = []


class VivaChatResponse(BaseModel):
    reply: str
    suggested_prompts: list[str] = []

