import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text
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
