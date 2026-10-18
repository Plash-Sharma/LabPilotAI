# 🚀 LabPilotAI

<div align="center">

<img src="./frontend/public/favicon.svg" alt="LabPilotAI Logo" width="96" height="96" />

### **AI-Powered Engineering Lab Documentation & Viva Prep Suite**

*Turn raw lab code, algorithms, and console outputs into university-compliant PDF records in seconds, then master viva examinations with Gemini-powered RAG tutoring and adaptive MCQ tests.*

[![Frontend Deployment](https://img.shields.io/badge/Vercel-Live%20Demo-black?logo=vercel)](https://lab-pilot-ai.vercel.app)
[![Backend API](https://img.shields.io/badge/Render-API%20Live-46E3B7?logo=render)](https://labpilot-huu9.onrender.com/docs)
[![Python Version](https://img.shields.io/badge/Python-3.12%2B-blue?logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwindcss)](https://tailwindcss.com)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI%20Powered-8E75C2?logo=google)](https://aistudio.google.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[**Explore Live App**](https://lab-pilot-ai.vercel.app) • [**API Documentation**](https://labpilot-huu9.onrender.com/docs) • [**Free Deployment Guide**](./docs/FREE_DEPLOYMENT_GUIDE.md)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [System Architecture Flow](#-system-architecture-flow)
- [Repository Structure](#-repository-structure)
- [Quick Start (Local Development)](#-quick-start-local-development)
  - [Prerequisites](#prerequisites)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Start Infrastructure (Docker)](#2-start-infrastructure-docker)
  - [3. Backend Setup](#3-backend-setup)
  - [4. Frontend Setup](#4-frontend-setup)
- [Environment Variables](#-environment-variables)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Deployment](#-deployment)
- [Contributing & License](#-contributing--license)

---

## 🌟 Overview

Engineering and computer science students spend hours formatting weekly lab records, re-formatting code blocks, drawing flowcharts, and compiling semester laboratory manuals. When practical evaluation day arrives, preparing for faculty viva voce and oral quizzes remains fragmented and stressful.

**LabPilotAI** automates this entire lifecycle:
1. **Automated Lab PDF Generation**: Takes student input (Aim, Algorithm, Code, Execution Output, Result, and Subject/Teacher metadata) and renders publication-quality, university-compliant PDF records complete with college logos and syntax-highlighted code.
2. **RAG Viva AI Tutor**: Ingests lab documentation into a PostgreSQL vector database (`pgvector`) and utilizes Google Gemini to simulate a viva examiner asking probing, concept-verifying oral questions.
3. **Adaptive MCQ Knowledge Testing**: Generates dynamic, multi-tier multiple-choice exams from the uploaded experiment to test conceptual clarity, providing real-time grading, deep explanations, and analytics.

---

## ✨ Key Features

### 📄 1. University-Compliant PDF Generation
- **Pixel-Perfect Styling**: Powered by **WeasyPrint**, **Jinja2**, and **Pygments** code tokenization.
- **Dynamic University Header**: Includes uploaded college crest/logo, student name, roll number, batch, teacher in charge, and experiment date.
- **Multi-Lab Merge**: Compile an entire semester's individual laboratory records into a unified, indexed course portfolio with a single click.
- **Flexible Storage**: Supports Cloudflare R2, AWS S3, or lightweight local volume storage.

### 🤖 2. Viva AI Tutor (RAG-Driven)
- **Document Chunking & Vector Search**: Automatic semantic vectorization of code and algorithm steps using `pgvector`.
- **Intelligent Oral Examiner**: Google Gemini analyzes student lab context to ask viva questions testing logic, time complexity, and practical edge cases.
- **Smart Hints & Evaluation**: Provides hints to guide student learning without simply giving away solutions.

### 📝 3. Adaptive MCQ Exam Generator
- **Multi-Tier Difficulty**: Questions classified across *Easy*, *Medium*, and *Hard* conceptual levels.
- **Instant Interactive Quizzes**: Timed evaluation with immediate scoring, conceptual breakdowns, strengths & weaknesses diagnostics, and personalized recommendations.
- **Historical Attempt Tracking**: Track past scores and performance over time for every submitted lab.

### 📊 4. Unified Student Dashboard
- **Subject & File Filters**: Easily search, sort, and organize lab records by subject, date, or experiment name.
- **Instant Previews & Downloads**: Embedded PDF preview with direct download buttons.
- **Zero-Lag UX**: Optimistic client updates with intelligent in-memory profile and lab caching.

### 🔐 5. Full-Stack Authentication & Account Recovery
- **JWT & BCrypt**: Cryptographically secure token management with BCrypt password hashing.
- **Password Complexity Rules**: Real-time frontend checklist verifying uppercase, lowercase, numbers, and symbols.
- **End-to-End Forgot & Reset Password Flow**: Secure tokenized password recovery with automated SMTP email sending (HTML + plain text fallback) and direct UI fallback links.
- **Custom Student Profiles**: Upload college crests, edit roll numbers, and update passwords seamlessly.

### 🌓 6. Modern Responsive UI
- **Dark & Light Mode**: Curated color schemes with smooth transitions.
- **Mobile Drawer Navigation**: Fully responsive navigation designed for mobile, tablet, and desktop screens.
- **Custom Branding**: Bespoke SVG vector icons and favicon branding.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React, React Router 6 |
| **Backend API** | FastAPI, Python 3.12, Pydantic v2, Uvicorn, Gunicorn |
| **Database & Vectors** | PostgreSQL 16 with `pgvector` extension, SQLAlchemy 2.0 (AsyncIO), Alembic |
| **PDF Rendering** | WeasyPrint, Jinja2, Pygments (Syntax Highlighting), Cairo, Pango |
| **AI & LLM** | Google Gemini (`gemini-2.5-flash` / `gemini-3.5-flash-lite`) via Google GenAI SDK |
| **Async Processing** | Celery + Redis (optional worker tasks for high-concurrency environments) |
| **Storage** | Cloudflare R2 / AWS S3 / Local Disk Storage |
| **DevOps & Hosting** | Docker, Docker Compose, GitHub Actions CI/CD, Vercel, Render |

---

## 🔄 System Architecture Flow

```mermaid
graph TD
    A[Student / Browser] -->|Vite + React SPA| B[LabPilotAI Frontend]
    B -->|REST API / JWT| C[FastAPI Backend]
    
    subgraph "Data & Vector Layer"
        C -->|Asyncpg / SQLAlchemy| D[(PostgreSQL + pgvector)]
        C -->|Celery / Redis| E[(Redis Cache / Broker)]
    end

    subgraph "AI & RAG Engine"
        C -->|Semantic Chunks| D
        C -->|Context + Prompts| F[Google Gemini API]
        F -->|Viva Questions & Hints| C
        F -->|Adaptive MCQs & Feedback| C
    end

    subgraph "Document Pipeline"
        C -->|HTML Template + Pygments| G[Jinja2 Engine]
        G -->|CSS Paged Media| H[WeasyPrint]
        H -->|Rendered PDF| I[Cloudflare R2 / S3 / Local]
        I -->|Download / Preview URL| B
    end
```

---

## 📂 Repository Structure

```text
LabPilotAI/
├── .github/
│   └── workflows/              # GitHub Actions CI & deployment pipelines
│       ├── ci.yml
│       └── deploy.yml
├── backend/
│   ├── alembic/                # Database migrations (schema evolution)
│   ├── app/
│   │   ├── api/                # API router endpoints
│   │   │   ├── routes/
│   │   │   │   ├── auth.py         # Login, register, forgot/reset password
│   │   │   │   ├── execution.py    # Code execution sandbox
│   │   │   │   ├── mcq.py          # Dynamic MCQ generation & scoring
│   │   │   │   ├── rag.py          # RAG Viva examination engine
│   │   │   │   ├── sessions.py     # Lab sessions management
│   │   │   │   ├── submissions.py  # Lab PDF submission & semester merge
│   │   │   │   └── templates.py    # PDF report layout templates
│   │   │   └── deps.py         # Auth & database dependency injection
│   │   ├── core/               # Database engine, security, initial seed data
│   │   ├── models/             # SQLAlchemy ORM models (User, Submission, MCQ...)
│   │   ├── services/           # PDF compiler, Gemini AI client, S3/R2 storage
│   │   └── templates/          # Jinja2 university PDF HTML/CSS templates
│   ├── tests/                  # Unit and integration test suites
│   ├── Dockerfile              # Backend container definition
│   └── requirements.txt        # Python backend dependencies
├── frontend/
│   ├── public/                 # Static assets & SVG favicon
│   ├── src/
│   │   ├── api/                # Axios/Fetch API client with caching
│   │   ├── components/         # Reusable UI (AuthForms, Logo, Requirements)
│   │   ├── contexts/           # AuthContext, ThemeContext (Dark/Light)
│   │   ├── pages/              # Dashboard, SubmitLab, VivaPrep, MCQTest, Profile...
│   │   ├── App.tsx             # Root layout & route configuration
│   │   └── main.tsx            # React application entrypoint
│   ├── package.json            # Node.js dependencies & scripts
│   └── vite.config.ts          # Vite build config & dev proxy
├── docs/                       # Guides and deployment walkthroughs
│   └── FREE_DEPLOYMENT_GUIDE.md
├── infra/                      # Local Docker Compose & Terraform configs
│   └── docker-compose.yml
└── README.md
```

---

## 💻 Quick Start (Local Development)

### Prerequisites
- **Python 3.12+**
- **Node.js 20+** & **npm**
- **Docker Desktop** (for PostgreSQL with `pgvector` & Redis)
- **Windows Only**: [MSYS2](https://www.msys2.org/) with `mingw-w64-ucrt-x86_64-pango` installed (required by WeasyPrint for PDF rendering)

---

### 1. Clone Repository
```bash
git clone https://github.com/Plash-Sharma/LabPilotAI.git
cd LabPilotAI
```

---

### 2. Start Infrastructure (Docker)
Start the local PostgreSQL (with `pgvector`) and Redis instances:
```bash
cd infra
docker-compose up -d
cd ..
```

---

### 3. Backend Setup

1. **Create and activate a Python virtual environment**:
   ```bash
   # Windows (PowerShell)
   python -m venv .venv
   .venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv .venv
   source .venv/bin/activate
   ```

2. **Install backend dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```

3. *(Windows Only)* **Add GTK/Pango libraries to PATH**:
   ```powershell
   $env:PATH = "C:\msys64\ucrt64\bin;" + $env:PATH
   ```

4. **Configure environment variables**:
   Create `backend/.env` (or copy from `.env.example`):
   ```ini
   DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5433/labpilotai
   SECRET_KEY=dev-secret-key-change-in-production
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=10080
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-2.5-flash
   CORS_ORIGINS=http://localhost:5173,http://localhost:5174
   ```

5. **Run database migrations & seed templates**:
   ```bash
   cd backend
   alembic upgrade head
   python -m app.core.seed
   ```

6. **Start the FastAPI backend server**:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   - API Root: `http://localhost:8000`
   - Interactive Swagger Docs: `http://localhost:8000/docs`

---

### 4. Frontend Setup

1. **Open a new terminal and navigate to the frontend directory**:
   ```bash
   cd frontend
   npm install
   ```

2. **Configure frontend environment**:
   Create `frontend/.env`:
   ```ini
   VITE_API_URL=http://localhost:8000/api/v1
   ```

3. **Start the Vite development server**:
   ```bash
   npm run dev
   ```
   - Application URL: `http://localhost:5173`

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string (`asyncpg`) | `postgresql+asyncpg://user:pass@host:5432/dbname` |
| `SECRET_KEY` | Cryptographic secret for signing JWTs | Random 64-char string |
| `ALGORITHM` | JWT signing algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES`| Expiry duration for auth tokens | `10080` (7 days) |
| `GEMINI_API_KEY` | Google Gemini API key | Get from [Google AI Studio](https://aistudio.google.com) |
| `GEMINI_MODEL` | Gemini LLM model identifier | `gemini-2.5-flash` |
| `CORS_ORIGINS` | Permitted frontend origins | `http://localhost:5173,https://lab-pilot-ai.vercel.app` |
| `FRONTEND_URL` | Base URL used in password reset links | `https://lab-pilot-ai.vercel.app` |
| `SMTP_HOST` | *(Optional)* SMTP mail server host | `smtp.gmail.com` |
| `SMTP_PORT` | *(Optional)* SMTP mail server port | `587` |
| `SMTP_USER` | *(Optional)* SMTP username / email address | `noreply@labpilotai.com` |
| `SMTP_PASSWORD` | *(Optional)* SMTP password or app password | `app-specific-password` |
| `S3_BUCKET_NAME` | *(Optional)* Bucket for PDF storage | `labpilotai-pdfs` |
| `S3_ENDPOINT_URL` | *(Optional)* Cloudflare R2 / S3 endpoint | `https://<account-id>.r2.cloudflarestorage.com` |
| `AWS_ACCESS_KEY_ID` | *(Optional)* R2 / AWS access key ID | `your-access-key` |
| `AWS_SECRET_ACCESS_KEY` | *(Optional)* R2 / AWS secret access key | `your-secret-key` |

### Frontend (`frontend/.env`)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base URL of the backend API v1 | `http://localhost:8000/api/v1` |

---

## 🧪 Testing & Quality Assurance

### Run Backend Tests
```bash
cd backend

# Run fast unit tests
pytest tests/unit/ -v

# Run full test suite (requires DB running)
pytest tests/ -v
```

### Static Analysis & Linting
```bash
# Python linting and formatting checks
cd backend
ruff check .
mypy .

# TypeScript validation and production build check
cd ../frontend
npm run build
```

---

## 🚀 Deployment

LabPilotAI is architected to run **100% free** on modern cloud hosting tiers:

- **Frontend**: Deploy with zero configuration on [Vercel](https://vercel.com) or [Cloudflare Pages](https://pages.cloudflare.com).
- **Backend**: Containerized Docker web service deployed on [Render](https://render.com) or [Railway](https://railway.app).
- **Database**: Managed PostgreSQL with `pgvector` hosted on [Supabase](https://supabase.com) or [Neon](https://neon.tech).
- **Storage**: S3-compatible, zero-egress fee PDF storage via [Cloudflare R2](https://www.cloudflare.com/products/r2/).

> 📘 **Step-by-step instructions:** Read the comprehensive [**Free Deployment Guide**](./docs/FREE_DEPLOYMENT_GUIDE.md) for full setup instructions.

---

## 📄 Contributing & License

Contributions, feature suggestions, and bug reports are welcome! Please open an issue or submit a pull request.

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Built with ❤️ for engineering students & educators by <a href="https://github.com/Plash-Sharma">Plash Sharma</a></sub>
</div>
