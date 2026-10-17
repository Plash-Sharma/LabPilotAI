from pathlib import Path
from dotenv import load_dotenv

backend_env = Path(__file__).resolve().parent.parent / ".env"
root_env = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(backend_env, override=True)
load_dotenv(root_env, override=False)

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

import os
from fastapi.middleware.cors import CORSMiddleware

# Allow local dev ports and production origins
cors_origins_env = os.getenv("CORS_ORIGINS")
if cors_origins_env:
    allowed_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]
else:
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Content-Length", "Content-Type"],
)

from app.api.routes import auth, execution, mcq, rag

# Register routers
api_router = FastAPI()

app.include_router(auth.router, prefix="/api/v1/auth")
app.include_router(templates.router, prefix="/api/v1")
app.include_router(sessions.router, prefix="/api/v1")
app.include_router(submissions.router, prefix="/api/v1")
app.include_router(rag.router, prefix="/api/v1")
app.include_router(execution.router, prefix="/api/v1")
app.include_router(mcq.router, prefix="/api/v1")


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Hello from LabPilotAI"}


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
