# LabPilotAI

> Turn raw lab code + output into a formatted PDF lab record, then use that PDF as a RAG knowledge base to generate viva/exam-style questions.

---

## Quick Start (Local Dev)

### Prerequisites
- Python 3.12+
- Node 20+
- Docker Desktop (for Postgres + Redis)
- MSYS2 with `mingw-w64-ucrt-x86_64-pango` (Windows only, for WeasyPrint)

### 1. Start infrastructure
```bash
cd infra
docker-compose up -d
```

### 2. Backend setup
```bash
# Create venv & install
python -m venv .venv
.venv\Scripts\Activate      # Windows
pip install -r backend/requirements.txt

# On Windows — add GTK libraries to PATH (needed by WeasyPrint)
# Run once in PowerShell:
$env:PATH = "C:\msys64\ucrt64\bin;" + $env:PATH

# Run migrations (requires DB running)
cd backend
alembic upgrade head

# Seed default templates
python -m app.core.seed

# Start the API
uvicorn app.main:app --reload
```

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
```

API is at http://localhost:8000 • Frontend at http://localhost:5173 • API docs at http://localhost:8000/docs

---

## Build Phases

| Phase | What | Status |
|-------|------|--------|
| 0 | Repo skeleton, docker-compose, FastAPI hello-world, CI skeleton | ✅ Done |
| 1 | Submission → synchronous PDF (Jinja2 + WeasyPrint + Pygments), 2 templates | ✅ Done |
| 2 | Celery workers, S3 storage, async PDF generation | ✅ Done |
| 3 | RAG indexing (pgvector) + Gemini question generation | ✅ Done |
| 4 | Auth (JWT), multi-session dashboard, semester merge | ✅ Done |
| 5 | GitHub Actions CI/CD | ✅ Done |
| 6 | Terraform AWS free-tier deployment | ✅ Done |
| 7 | Scaling refinements | ✅ Done |

---

## Running Tests
```bash
cd backend

# Unit tests (no DB required)
pytest tests/unit/ -v

# All tests (requires DB running)
pytest tests/ -v
```

## Linting & Type Checking
```bash
cd backend
ruff check .
mypy .
```
