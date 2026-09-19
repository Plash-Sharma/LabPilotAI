from dotenv import load_dotenv
load_dotenv()

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI

from app.api.routes import sessions, submissions, templates
from app.core.database import Base, engine


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Create tables on startup (Alembic handles this in prod; this is for local dev convenience)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="LabPilotAI API",
    description="Format lab submissions into PDFs and generate viva-prep questions via RAG.",
    version="0.1.0",
    lifespan=lifespan,
)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.routes import auth, rag, execution

# Register routers
api_router = FastAPI()

app.include_router(auth.router, prefix="/api/v1/auth")
app.include_router(templates.router, prefix="/api/v1")
app.include_router(sessions.router, prefix="/api/v1")
app.include_router(submissions.router, prefix="/api/v1")
app.include_router(rag.router, prefix="/api/v1")
app.include_router(execution.router, prefix="/api/v1")


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Hello from LabPilotAI"}


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
