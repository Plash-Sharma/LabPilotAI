import uuid
from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    name: Mapped[str] = mapped_column(String)
    password_hash: Mapped[str] = mapped_column(String)
    college: Mapped[str] = mapped_column(String)
    college_logo: Mapped[str | None] = mapped_column(Text, nullable=True)
    roll_number: Mapped[str | None] = mapped_column(String, nullable=True)
    reset_token: Mapped[str | None] = mapped_column(String, nullable=True)
    reset_token_expires: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    sessions: Mapped[list["LabSession"]] = relationship(back_populates="user")

class LabSession(Base):
    __tablename__ = "lab_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    subject: Mapped[str] = mapped_column(String)
    semester: Mapped[str] = mapped_column(String)

    user: Mapped["User"] = relationship(back_populates="sessions")
    submissions: Mapped[list["Submission"]] = relationship(back_populates="lab_session")

class Template(Base):
    __tablename__ = "templates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String)
    college_scope: Mapped[str] = mapped_column(String)
    layout_config: Mapped[dict] = mapped_column(JSON)

    submissions: Mapped[list["Submission"]] = relationship(back_populates="template")

class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    lab_session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("lab_sessions.id"), nullable=True)
    template_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("templates.id"))
    
    user: Mapped["User"] = relationship("User")
    template: Mapped["Template"] = relationship("Template")
    chunks: Mapped[list["DocumentChunk"]] = relationship("DocumentChunk", back_populates="submission", cascade="all, delete-orphan")
    viva_questions: Mapped[list["VivaQuestion"]] = relationship("VivaQuestion", back_populates="submission", cascade="all, delete-orphan")
    mcq_tests: Mapped[list["MCQTest"]] = relationship("MCQTest", back_populates="submission", cascade="all, delete-orphan")
    
    aim: Mapped[str] = mapped_column(Text)
    algorithm: Mapped[str] = mapped_column(Text)
    code: Mapped[str] = mapped_column(Text)
    output: Mapped[str] = mapped_column(Text)
    result: Mapped[str] = mapped_column(Text)
    
    filename: Mapped[str | None] = mapped_column(String, nullable=True)
    date_of_lab: Mapped[str | None] = mapped_column(String, nullable=True)
    subject_of_lab: Mapped[str | None] = mapped_column(String, nullable=True)
    subject_code: Mapped[str | None] = mapped_column(String, nullable=True)
    group_name: Mapped[str | None] = mapped_column(String, nullable=True)
    batch_name: Mapped[str | None] = mapped_column(String, nullable=True)
    teacher_name: Mapped[str | None] = mapped_column(String, nullable=True)
    include_logo: Mapped[bool | None] = mapped_column(Boolean, default=True, nullable=True)

    status: Mapped[str] = mapped_column(String, default="pending")
    pdf_url: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    lab_session: Mapped["LabSession"] = relationship(back_populates="submissions")
    template: Mapped["Template"] = relationship(back_populates="submissions")

from pgvector.sqlalchemy import Vector


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("submissions.id"))
    content: Mapped[str] = mapped_column(Text)
    embedding: Mapped[list[float]] = mapped_column(Vector(768))  # Google's text-embedding-004 is 768 dims

    submission: Mapped["Submission"] = relationship("Submission")

class VivaQuestion(Base):
    __tablename__ = "viva_questions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("submissions.id"))
    question_text: Mapped[str] = mapped_column(Text)
    answer_hint: Mapped[str] = mapped_column(Text, nullable=True)

    submission: Mapped["Submission"] = relationship("Submission")


class MCQTest(Base):
    __tablename__ = "mcq_tests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("submissions.id"))
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String)
    topic: Mapped[str | None] = mapped_column(String, nullable=True)
    total_questions: Mapped[int] = mapped_column(default=10)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    submission: Mapped["Submission"] = relationship(back_populates="mcq_tests")
    questions: Mapped[list["MCQQuestion"]] = relationship("MCQQuestion", back_populates="test", cascade="all, delete-orphan", order_by="MCQQuestion.order_index")
    attempts: Mapped[list["MCQAttempt"]] = relationship("MCQAttempt", back_populates="test", cascade="all, delete-orphan", order_by="MCQAttempt.created_at.desc()")


class MCQQuestion(Base):
    __tablename__ = "mcq_questions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    test_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("mcq_tests.id"))
    order_index: Mapped[int] = mapped_column(default=0)
    question_text: Mapped[str] = mapped_column(Text)
    options: Mapped[list] = mapped_column(JSON)  # List of 4 string options
    correct_index: Mapped[int] = mapped_column()  # 0, 1, 2, or 3
    explanation: Mapped[str] = mapped_column(Text)
    difficulty: Mapped[str] = mapped_column(String, default="medium")  # easy, medium, hard
    concept: Mapped[str] = mapped_column(String, default="General")

    test: Mapped["MCQTest"] = relationship(back_populates="questions")


class MCQAttempt(Base):
    __tablename__ = "mcq_attempts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    test_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("mcq_tests.id"))
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    score: Mapped[int] = mapped_column()
    total_questions: Mapped[int] = mapped_column()
    percentage: Mapped[float] = mapped_column()
    level: Mapped[str] = mapped_column(String)  # Mastery, Proficient, Intermediate, Beginner
    feedback: Mapped[str] = mapped_column(Text)
    analysis: Mapped[dict] = mapped_column(JSON)  # strengths, weaknesses, suggestions
    selected_answers: Mapped[dict] = mapped_column(JSON)  # {question_id_str: option_index}
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    test: Mapped["MCQTest"] = relationship(back_populates="attempts")
