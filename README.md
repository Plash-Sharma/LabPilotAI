# 🚀 LabPilotAI

<div align="center">

<img src="./frontend/public/favicon.svg" alt="LabPilotAI Logo" width="100" height="100" />

### **Intelligent Engineering Lab Documentation, RAG Viva Examiner & Adaptive MCQ Testing Suite**

*Automate university-compliant lab records with syntax highlighting and college crests, master oral examinations with Gemini-powered RAG tutoring, and validate conceptual mastery with dynamic MCQ tests.*

[![CI Pipeline](https://github.com/Plash-Sharma/LabPilotAI/actions/workflows/ci.yml/badge.svg)](https://github.com/Plash-Sharma/LabPilotAI/actions/workflows/ci.yml)
[![Live Frontend](https://img.shields.io/badge/Frontend-Vercel%20Live-black?logo=vercel)](https://lab-pilot-ai.vercel.app)
[![Backend API](https://img.shields.io/badge/API-Render%20Live-46E3B7?logo=render)](https://labpilot-huu9.onrender.com/docs)
[![Python Version](https://img.shields.io/badge/Python-3.12%2B-blue?logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2%2B-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?logo=tailwindcss)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20%2B%20pgvector-336791?logo=postgresql)](https://github.com/pgvector/pgvector)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI%20GenAI%20SDK-8E75C2?logo=google)](https://aistudio.google.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[**🌐 Live Application**](https://lab-pilot-ai.vercel.app) • [**📖 Swagger API Docs**](https://labpilot-huu9.onrender.com/docs) • [**☁️ Free Deployment Guide**](./docs/FREE_DEPLOYMENT_GUIDE.md)

</div>

---

## 📑 Table of Contents

- [Executive Summary](#-executive-summary)
- [System Architecture](#-system-architecture)
- [Deep Dive: Core Pillars & Features](#-deep-dive-core-pillars--features)
  - [1. Automated University Lab Report Generation](#1-automated-university-lab-report-generation)
  - [2. AI-Powered Viva Tutor & Oral Examiner (RAG)](#2-ai-powered-viva-tutor--oral-examiner-rag)
  - [3. Adaptive MCQ Knowledge Testing Engine](#3-adaptive-mcq-knowledge-testing-engine)
  - [4. Code Execution Sandbox](#4-code-execution-sandbox)
  - [5. Unified Student Dashboard & Multi-Lab Merge](#5-unified-student-dashboard--multi-lab-merge)
  - [6. Enterprise-Grade Security & Account Recovery](#6-enterprise-grade-security--account-recovery)
  - [7. Modern Responsive UI & Design Aesthetics](#7-modern-responsive-ui--design-aesthetics)
- [Complete Technology Stack](#-complete-technology-stack)
- [Data Models & Schema Architecture](#-data-models--schema-architecture)
- [REST API Reference](#-rest-api-reference)
- [Repository Structure](#-repository-structure)
- [Local Development Walkthrough](#-local-development-walkthrough)
  - [Prerequisites](#prerequisites)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Start Infrastructure via Docker](#2-start-infrastructure-via-docker)
  - [3. Backend Configuration & Setup](#3-backend-configuration--setup)
  - [4. Frontend Configuration & Setup](#4-frontend-configuration--setup)
- [Environment Variables Configuration](#-environment-variables-configuration)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Production Deployment](#-production-deployment)
- [License & Author](#-license--author)

---

## 💡 Executive Summary

Laboratory coursework in computer science and engineering disciplines requires students to submit formatted practical reports every week containing algorithms, source code, execution outputs, and theoretical deductions. At examination time, students face rigorous viva voce assessments and oral questions from external examiners with limited preparation resources.

**LabPilotAI** solves both challenges simultaneously:
1. **Document Pipeline**: Ingests raw code (C++, Python, Java) and execution output, runs formatting and syntax highlighting via Pygments, and generates publication-grade, university-compliant PDF reports using WeasyPrint with college crests and student metadata.
2. **Cognitive AI Tutor**: Parses generated lab reports into semantic vector chunks using `pgvector` and Google Gemini embeddings (`gemini-embedding-001`), simulating an interactive viva examination professor who asks conceptual, algorithmic, and edge-case questions.
3. **Adaptive MCQ Engine**: Dynamically creates tailored, non-repeating multiple-choice quizzes across three difficulty tiers (*Easy*, *Medium*, *Hard*) with real-time scoring, analytical breakdowns of strong/weak topics, and step-by-step explanations.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client ["Frontend Layer (Vite + React 18 + TS)"]
        UI[Single Page Application]
        AuthCtx[AuthContext & JWT Cache]
        ThemeCtx[ThemeContext Dark/Light]
        ClientAPI[Optimistic API Client]
    end

    subgraph Gateway ["FastAPI Gateway & Auth"]
        Router[API Router /api/v1]
        JWTAuth[OAuth2 / BCrypt Auth Filter]
        CORS[CORS Middleware]
    end

    subgraph Processing ["Core Service Layer"]
        PDFServ[PDF Compiler Service]
        ExecServ[Sandbox Execution Engine]
        RAGServ[RAG & Viva Tutor Service]
        MCQServ[Adaptive MCQ Service]
        MergeServ[PDF Binder Merger]
        StorageServ[S3 / Cloudflare R2 / Local Disk]
    end

    subgraph AI ["AI & Vector Intelligence"]
        GeminiLLM[Google Gemini 2.5 Flash / 3.5 Flash Lite]
        GeminiEmbed[Google GenAI Embeddings text-embedding-004]
    end

    subgraph Data ["Data Persistence Layer"]
        Postgres[(PostgreSQL 16 DB)]
        PGVector[(pgvector 768-dim Embeddings)]
        RedisCache[(Redis Broker / Cache)]
    end

    UI --> ClientAPI
    ClientAPI -->|REST + Bearer Token| CORS
    CORS --> Router
    Router --> JWTAuth

    JWTAuth --> PDFServ
    JWTAuth --> ExecServ
    JWTAuth --> RAGServ
    JWTAuth --> MCQServ
    JWTAuth --> MergeServ

    PDFServ -->|Jinja2 + WeasyPrint + Pygments| StorageServ
    ExecServ -->|Subprocess C++/Py/Java Sandbox| ExecServ
    RAGServ -->|Vector Search & Chunking| PGVector
    RAGServ -->|Context + Prompts| GeminiLLM
    MCQServ -->|Question Generation & Evaluation| GeminiLLM
    MergeServ -->|PyPDF2 Binder Assembly| StorageServ

    RAGServ -.->|Embed Content| GeminiEmbed
    GeminiEmbed -.->|768-dim Vectors| PGVector
    Router --> Postgres
```

---

## 🔬 Deep Dive: Core Pillars & Features

### 1. Automated University Lab Report Generation
- **Single & Multi-Problem Support**: Submit either a single comprehensive experiment or an array of distinct problems (e.g., Problem 1: Binary Search Tree insertion, Problem 2: AVL Tree rotations).
- **Intelligent Pygments Tokenization**: Automatic lexer detection for C++, Python, Java, JavaScript, and other languages, rendering tokenized, syntax-colored code blocks with custom background containers.
- **University Layout Templates**:
  - `nit_jalandhar_default.html`: National Institute of Technology Jalandhar standard academic laboratory layout with formal borders, departmental headers, and signature blocks.
  - `generic_minimal.html`: Clean, modern international academic standard template.
- **Custom Institutional Branding**: Dynamically embeds college names, student roll numbers, batch identifiers, group designations, supervising faculty names, and uploaded college crests.
- **Semester Portfolio Merging**: Merge all completed lab experiments of a subject into a single course binder with a unified index (`/sessions/{id}/merge`).

### 2. AI-Powered Viva Tutor & Oral Examiner (RAG)
- **Vector Ingestion Pipeline**: Extracts plain text from the compiled PDF using `PyPDF2`, divides it into 1,000-character semantic chunks, and generates 768-dimensional vector embeddings via `gemini-embedding-001`.
- **RAG Semantic Search**: Stores chunks in PostgreSQL using `pgvector` for similarity matching against examiner queries.
- **Conversational Oral Examination**: Interactive ChatGPT-style conversational tutor (`/submissions/{id}/chat`) powered by `gemini-2.5-flash` / `gemini-3.5-flash-lite`.
- **Algorithmic Heuristic Fallback**: Includes built-in analytical heuristics that detect sorting algorithms, recursion, loop invariants, and binary search logic to generate viva questions even if Gemini API limits are reached.
- **Clean Mathematical Notation**: Custom prompt constraints enforce plain text and code backtick formatting for asymptotic notation (`O(N log N)`) avoiding confusing LaTeX raw dollar signs.

### 3. Adaptive MCQ Knowledge Testing Engine
- **Dynamic Question Synthesis**: Generates 10 to 15 unique multiple-choice questions tailored to the student's exact code implementation, time complexity, and theoretical foundations.
- **Cross-Attempt Deduplication**: Queries past question texts (`get_existing_question_texts`) to guarantee completely new questions on every practice run.
- **3-Tier Difficulty Distribution**: Questions explicitly balanced between *Easy* (syntax, output verification), *Medium* (algorithm logic, trace), and *Hard* (edge cases, asymptotic bounds).
- **Instant Automated Evaluation**: Immediate grading upon submission with detailed step-by-step rationales for each option.
- **Diagnostic Performance Analytics**:
  - Proficiency classification: **Mastery** (≥85%), **Proficient** (70–84%), **Intermediate** (50–69%), **Beginner** (<50%).
  - Concept-by-concept accuracy breakdown.
  - Identification of primary strengths and critical weaknesses with targeted study recommendations.

### 4. Code Execution Sandbox
- **In-Browser Execution**: Integrated code runner supporting **Python**, **C++ (g++)**, and **Java (javac/java)** directly inside the lab submission interface.
- **Isolated Subprocess Execution**: Sandboxed script creation with input stream (`stdin`) feeding, strict 10-second timeout enforcement, and captured `stdout`/`stderr`.
- **Auto-Fill Outputs**: One-click transfer of execution results directly into the lab report's *Observed Output* field.

### 5. Unified Student Dashboard & Multi-Lab Merge
- **Multi-Dimension Filtering**: Real-time client-side search by filename, aim, or subject dropdown.
- **Status Indicators**: Visual badges denoting report status (`Ready`, `Pending`, `Failed`).
- **In-Modal PDF Previewing**: Inline PDF rendering without leaving the dashboard via `/submissions/{id}/view`.
- **One-Click Downloads**: Direct downloads with sanitized, encoded Content-Disposition filenames via `/submissions/{id}/download`.
- **Direct Action Links**: Quick navigation to launch a Viva session or MCQ test directly from any lab card.

### 6. Enterprise-Grade Security & Account Recovery
- **Cryptographic Authentication**: JWT access tokens signed with `HS256` and password hashing utilizing `bcrypt`.
- **Enforced Password Complexity**: Real-time validation requiring ≥8 characters, uppercase, lowercase, numbers, and special symbols (`!@#$%^&*`).
- **Complete Forgot & Reset Password Sequence**:
  - Generates cryptographically secure 32-byte tokens with 15-minute expiration.
  - Automated HTML email dispatching using Python's standard `smtplib` and `MIMEMultipart`.
  - Smart URL builder utilizing request origin and referer headers.
  - Dedicated `/reset-password?token=...` UI with direct fallback links for rapid testing and production resilience.
- **Student Profile Management**: Pre-cached user profile with college name, roll number, and custom crest/logo base64 storage.

### 7. Modern Responsive UI & Design Aesthetics
- **Dark & Light Mode**: Seamless dark and light themes with state persistence via `ThemeContext`.
- **Fluid Layouts**: Desktop sidebar paired with a mobile slide-out drawer navigation menu.
- **Custom Branding**: Bespoke SVG vector icons, favicon, and modern typography.
- **Zero-Latency In-Memory Cache**: SWR-style caching for user profiles and lab templates, preventing unnecessary API waterfalls.

---

## 💻 Complete Technology Stack

| Layer | Component | Version / Description |
| :--- | :--- | :--- |
| **Frontend** | React | 18.2.0 |
| | TypeScript | 5.2.2 |
| | Vite | 5.2.0 (Fast HMR & Optimized Production Bundler) |
| | Styling | Tailwind CSS 4.0 / PostCSS |
| | Icons | Lucide React |
| | Routing | React Router DOM 7.18 |
| **Backend** | FastAPI | 0.110+ (Asynchronous ASGI Web Framework) |
| | Python | 3.12+ |
| | ASGI Server | Uvicorn & Gunicorn |
| | Validation | Pydantic v2 & Pydantic-Settings |
| **Database** | PostgreSQL | 16 with `pgvector` Extension |
| | ORM | SQLAlchemy 2.0 (AsyncIO with `asyncpg`) |
| | Migrations | Alembic |
| **PDF Generation** | WeasyPrint | Paged Media CSS & HTML to PDF Compiler |
| | Templating | Jinja2 |
| | Syntax Highlighter | Pygments (Tokenized HTML Formatting) |
| | System Libraries | Cairo, Pango, GDK-Pixbuf, libffi |
| **AI & LLM** | LLM Engine | Google Gemini (`gemini-2.5-flash`, `gemini-3.5-flash-lite`) |
| | Vector Embeddings | Google GenAI SDK (`gemini-embedding-001`, 768 dims) |
| **Storage & Workers** | Object Storage | Cloudflare R2 / AWS S3 / Local Disk Fallback |
| | Worker Tasks | Celery 5.3 + Redis 7 (Async PDF generation support) |
| **DevOps** | Containerization | Docker & Docker Compose |
| | Cloud Hosting | Vercel (Frontend), Render (Backend), Supabase (DB), R2 (Storage) |
| | CI / CD | GitHub Actions Workflows |

---

## 🗄️ Data Models & Schema Architecture

```
                    ┌───────────────────────────┐
                    │           users           │
                    ├───────────────────────────┤
                    │ id (UUID, PK)             │
                    │ email (String, Unique)    │
                    │ password_hash (String)    │
                    │ name (String)             │
                    │ college (String)          │
                    │ college_logo (Text)       │
                    │ roll_number (String)      │
                    │ reset_token (String)      │
                    │ reset_token_expires (DT)  │
                    └─────────────┬─────────────┘
                                  │ 1:N
         ┌────────────────────────┼────────────────────────┐
         │ 1:N                    │ 1:N                    │ 1:N
┌────────▼──────────┐    ┌────────▼──────────┐    ┌────────▼──────────┐
│   lab_sessions    │    │    submissions    │    │     mcq_tests     │
├───────────────────┤    ├───────────────────┤    ├───────────────────┤
│ id (UUID, PK)     │    │ id (UUID, PK)     │    │ id (UUID, PK)     │
│ user_id (FK)      │◄───┤ lab_session_id(FK)│    │ submission_id(FK) │
│ subject (String)  │    │ user_id (FK)      │    │ user_id (FK)      │
│ semester (String) │    │ template_id (FK)  │    │ title (String)    │
└───────────────────┘    │ aim, algorithm    │    │ topic (String)    │
                         │ code, output      │    │ total_questions   │
                         │ result, filename  │    └─────────┬─────────┘
                         │ subject_of_lab    │              │ 1:N
                         │ teacher_name      │     ┌────────┴────────┐
                         │ status, pdf_url   │     │                 │
                         └─────────┬─────────┘     │ 1:N             │ 1:N
                                   │          ┌────▼────────┐  ┌─────▼────────┐
             ┌─────────────────────┼────┐     │mcq_questions│  │ mcq_attempts │
             │ 1:N                 │1:N │     ├─────────────┤  ├──────────────┤
     ┌───────▼────────┐     ┌──────▼──┐ │     │id (UUID, PK)│  │id (UUID, PK) │
     │ document_chunks│     │  viva_  │ │     │test_id (FK) │  │test_id (FK)  │
     ├────────────────┤     │questions│ │     │question_text│  │user_id (FK)  │
     │id (UUID, PK)   │     ├─────────┤ │     │options (JSON│  │score, level  │
     │submission_id   │     │id (UUID)│ │     │correct_index│  │percentage    │
     │content (Text)  │     │question │ │     │explanation  │  │analysis(JSON)│
     │embedding       │     │answer_  │ │     │difficulty   │  │answers (JSON)│
     │  (Vector 768)  │     │  hint   │ │     │concept      │  └──────────────┘
     └────────────────┘     └─────────┘ │     └─────────────┘
                                        │
                               ┌────────▼────────┐
                               │    templates    │
                               ├─────────────────┤
                               │ id (UUID, PK)   │
                               │ name (String)   │
                               │ college_scope   │
                               │ layout_config   │
                               └─────────────────┘
```

---

## 📡 REST API Reference

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/register` | Register student account with optional college logo upload |
| `POST` | `/auth/login` | Authenticate user via OAuth2 form and receive JWT access token |
| `GET` | `/auth/me` | Fetch authenticated user profile details |
| `POST` | `/auth/forgot-password` | Generate reset token, send SMTP email, and return reset link |
| `POST` | `/auth/reset-password` | Validate reset token, check password complexity, update hash |
| `POST` | `/auth/change-password` | Authenticated password change with old password verification |

### Lab Submissions (`/api/v1/submissions`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/submissions` | Create lab experiment submission and trigger PDF compiler |
| `GET` | `/submissions` | List all lab submissions for authenticated user |
| `GET` | `/submissions/{id}` | Retrieve specific lab submission status and metadata |
| `DELETE`| `/submissions/{id}` | Delete submission, remove PDF file, and cascade delete tests/MCQs |
| `GET` | `/submissions/{id}/view` | View inline rendered PDF for browser preview modal |
| `GET` | `/submissions/{id}/download`| Direct attachment download of generated lab report PDF |

### Lab Sessions & Semester Merge (`/api/v1/sessions`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/sessions` | Create a new subject/semester session grouping |
| `GET` | `/sessions` | List user's lab sessions |
| `GET` | `/sessions/{id}` | Get specific session and associated lab submissions |
| `GET` | `/sessions/{id}/merge` | Merge all completed PDFs in a session into a course binder |

### Code Execution Sandbox (`/api/v1/execute`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/execute` | Run Python, C++, or Java code safely with timeout and return stdout/stderr |

### RAG & Viva AI Tutor (`/api/v1/submissions`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/submissions/{id}/generate-questions` | Generate 5 viva questions via Gemini RAG with heuristic fallback |
| `GET` | `/submissions/{id}/questions` | Retrieve cached viva questions for a lab submission |
| `POST` | `/submissions/{id}/chat` | Interactive ChatGPT-style conversational viva practice session |

### Adaptive MCQ Engine (`/api/v1`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/submissions/{id}/mcq/generate` | Synthesize 10–15 dynamic, non-repeating MCQs across difficulty tiers |
| `GET` | `/submissions/{id}/mcq/tests` | List all MCQ tests generated for a submission |
| `GET` | `/mcq/tests/{test_id}` | Retrieve test questions (answers hidden from public view) |
| `POST` | `/mcq/tests/{test_id}/submit` | Submit answers, calculate score, evaluate strengths/weaknesses |
| `GET` | `/mcq/tests/{test_id}/attempts` | List historical attempt summaries for a test |
| `GET` | `/mcq/attempts/{attempt_id}` | Detailed attempt breakdown with question-by-question explanations |
| `DELETE`| `/mcq/tests/{test_id}` | Delete an MCQ test and all associated attempt history |

### Templates (`/api/v1/templates`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/templates` | List all available university PDF layout templates |
| `GET` | `/templates/{id}` | Get template configuration and styling rules |

---

## 📁 Repository Structure

```text
LabPilotAI/
├── .github/
│   └── workflows/
│       ├── ci.yml                  # GitHub Actions CI (Ruff, pytest, tsc, vite build)
│       └── deploy.yml              # Deployment workflow
├── backend/
│   ├── alembic/                    # Database schema migration versions
│   │   ├── versions/
│   │   │   ├── e1329459c1a0_initial_migration.py
│   │   │   ├── 6aa81d5286be_add_vector_and_phase_3_models.py
│   │   │   ├── 257764537761_add_password_hash.py
│   │   │   ├── 7bb92e64889c_add_mcq_models.py
│   │   │   └── 8cc91a23b45e_add_user_profile_and_submission_meta.py
│   │   └── env.py
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py             # Auth & DB dependency injection
│   │   │   └── routes/
│   │   │       ├── auth.py         # Login, register, forgot/reset password
│   │   │       ├── execution.py    # Code execution sandbox
│   │   │       ├── mcq.py          # Dynamic MCQ test generator & grading
│   │   │       ├── rag.py          # RAG Viva question generation & interactive chat
│   │   │       ├── sessions.py     # Session creation & PDF binder merging
│   │   │       ├── submissions.py  # Lab experiment submission & PDF downloads
│   │   │       └── templates.py    # Academic PDF templates
│   │   ├── core/
│   │   │   ├── database.py         # SQLAlchemy AsyncIO engine & sessionmaker
│   │   │   └── seed.py             # Default template seeder
│   │   ├── models/
│   │   │   └── models.py           # User, LabSession, Submission, DocumentChunk...
│   │   ├── schemas/
│   │   │   └── schemas.py          # Pydantic request & response contracts
│   │   ├── services/
│   │   │   ├── mcq_service.py      # Adaptive MCQ generation & diagnostics
│   │   │   ├── merge_service.py    # PyPDF2 binder merging
│   │   │   ├── pdf_service.py      # WeasyPrint, Pygments, & Jinja2 PDF engine
│   │   │   ├── rag_service.py      # PDF text extractor, pgvector & Gemini RAG
│   │   │   └── storage_service.py  # S3 / Cloudflare R2 / local disk handler
│   │   ├── templates/              # Jinja2 university PDF HTML templates
│   │   │   ├── generic_minimal.html
│   │   │   └── nit_jalandhar_default.html
│   │   └── main.py                 # FastAPI application factory & CORS setup
│   ├── tests/                      # Pytest unit & integration test suites
│   ├── Dockerfile                  # Production container definition (Python 3.12)
│   ├── pyproject.toml              # Ruff, mypy, pytest configuration
│   └── requirements.txt            # Python dependencies
├── frontend/
│   ├── public/                     # Favicon, SVG logos, assets
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts           # Type-safe API client with in-memory caching
│   │   ├── components/
│   │   │   ├── AuthForms.tsx       # Sign In, Registration, Forgot & Reset views
│   │   │   ├── LabPilotLogo.tsx    # Bespoke SVG logo component
│   │   │   └── PasswordRequirements.tsx # Real-time complexity validator
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx     # JWT state management
│   │   │   └── ThemeContext.tsx    # Dark/Light mode theme state
│   │   ├── pages/
│   │   │   ├── ChangePassword.tsx  # In-dashboard password updater
│   │   │   ├── Dashboard.tsx       # Lab list, subject filters, preview & merge
│   │   │   ├── MCQTest.tsx         # MCQ test generator, quiz runner & analytics
│   │   │   ├── Profile.tsx         # Student profile & college crest view
│   │   │   ├── SubmitLab.tsx       # Lab report editor, code runner & PDF preview
│   │   │   └── VivaPrep.tsx        # Interactive conversational Viva AI examiner
│   │   ├── App.tsx                 # Navigation, sidebar, drawer, route guards
│   │   ├── index.css               # Design system tokens & global styling
│   │   └── main.tsx                # React DOM entrypoint
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── docs/
│   └── FREE_DEPLOYMENT_GUIDE.md    # 100% Free deployment instructions
├── infra/
│   ├── docker-compose.yml          # PostgreSQL 16 (pgvector) + Redis 7
│   └── main.tf                     # Terraform cloud infrastructure
├── render.yaml                     # Render.com blueprint configuration
├── LICENSE                         # MIT License
└── README.md
```

---

## 🛠️ Local Development Walkthrough

### Prerequisites
- **Python 3.12+**
- **Node.js 20+** & **npm**
- **Docker Desktop** (for local PostgreSQL with `pgvector` & Redis)
- **Windows Users**: Install [MSYS2](https://www.msys2.org/) with `mingw-w64-ucrt-x86_64-pango` for WeasyPrint rendering support.

---

### 1. Clone Repository
```bash
git clone https://github.com/Plash-Sharma/LabPilotAI.git
cd LabPilotAI
```

---

### 2. Start Infrastructure via Docker
Launch the PostgreSQL database with `pgvector` extension and Redis broker:
```bash
cd infra
docker-compose up -d
cd ..
```
*Port mappings: PostgreSQL is exposed on `localhost:5433`, Redis on `localhost:6379`.*

---

### 3. Backend Configuration & Setup

1. **Create and activate a virtual environment**:
   ```powershell
   # Windows (PowerShell)
   python -m venv .venv
   .venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv .venv
   source .venv/bin/activate
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```

3. *(Windows Users Only)* **Add GTK / Pango libraries to your PATH**:
   ```powershell
   $env:PATH = "C:\msys64\ucrt64\bin;" + $env:PATH
   ```

4. **Set up Environment Variables**:
   Create a `backend/.env` file:
   ```ini
   DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5433/labpilotai
   SECRET_KEY=local-dev-secret-key-change-in-production
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=10080
   GEMINI_API_KEY=your_google_ai_studio_api_key_here
   GEMINI_MODEL=gemini-2.5-flash
   CORS_ORIGINS=http://localhost:5173,http://localhost:5174
   USE_CELERY=false
   ```

5. **Apply Database Migrations & Seed Default Templates**:
   ```bash
   cd backend
   alembic upgrade head
   python -m app.core.seed
   ```

6. **Start the FastAPI Development Server**:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   - API Root: `http://localhost:8000`
   - Interactive Swagger Documentation: `http://localhost:8000/docs`

---

### 4. Frontend Configuration & Setup

1. **Open a new terminal and navigate to the frontend directory**:
   ```bash
   cd frontend
   npm install
   ```

2. **Set up Frontend Environment**:
   Create a `frontend/.env` file:
   ```ini
   VITE_API_URL=http://localhost:8000/api/v1
   ```

3. **Start the Vite Development Server**:
   ```bash
   npm run dev
   ```
   - Application URL: `http://localhost:5173`

---

## ⚙️ Environment Variables Configuration

### Backend Options (`backend/.env`)

| Variable | Description | Required | Default / Example |
| :--- | :--- | :---: | :--- |
| `DATABASE_URL` | PostgreSQL connection string using `asyncpg` driver | **Yes** | `postgresql+asyncpg://postgres:postgres@localhost:5433/labpilotai` |
| `SECRET_KEY` | Secret cryptographic key for signing JWT tokens | **Yes** | Minimum 32-character random string |
| `ALGORITHM` | JWT signing algorithm | No | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token validity duration | No | `10080` (7 days) |
| `GEMINI_API_KEY` | Google Gemini API key for RAG & MCQs | **Yes** | Obtain from [Google AI Studio](https://aistudio.google.com) |
| `GEMINI_MODEL` | Gemini LLM model identifier | No | `gemini-2.5-flash` or `gemini-3.5-flash-lite` |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins | No | `http://localhost:5173,https://lab-pilot-ai.vercel.app` |
| `FRONTEND_URL` | Base URL used to construct password reset links | No | `https://lab-pilot-ai.vercel.app` |
| `USE_CELERY` | Enable background task offloading to Celery worker | No | `false` (uses FastAPI BackgroundTasks for free tier) |
| `REDIS_URL` | Redis connection string for Celery broker | No | `redis://localhost:6379/0` |
| `SMTP_HOST` | SMTP server host for sending password reset emails | No | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port (typically 587 for TLS or 465 for SSL) | No | `587` |
| `SMTP_USER` | SMTP username / sender email address | No | `noreply@labpilotai.com` |
| `SMTP_PASSWORD` | SMTP password or Google App Password | No | `your-app-password` |
| `SMTP_FROM` | Sender email address display | No | `noreply@labpilotai.com` |
| `SMTP_TLS` | Enable TLS encryption for SMTP communication | No | `true` |
| `S3_BUCKET_NAME` | Cloudflare R2 or AWS S3 bucket name | No | `labpilotai-pdfs` |
| `S3_ENDPOINT_URL` | S3 API endpoint URL (for Cloudflare R2) | No | `https://<account-id>.r2.cloudflarestorage.com` |
| `AWS_ACCESS_KEY_ID` | Cloudflare R2 / AWS Access Key ID | No | `your-r2-access-key` |
| `AWS_SECRET_ACCESS_KEY` | Cloudflare R2 / AWS Secret Access Key | No | `your-r2-secret-key` |
| `AWS_REGION` | Storage region | No | `auto` |

### Frontend Options (`frontend/.env`)

| Variable | Description | Required | Default |
| :--- | :--- | :---: | :--- |
| `VITE_API_URL` | Base URL of the backend API v1 | **Yes** | `http://localhost:8000/api/v1` |

---

## 🧪 Testing & Quality Assurance

### Backend Test Suite
```bash
cd backend

# Run fast unit tests (no external services needed)
pytest tests/unit/ -v

# Run full test suite with coverage
pytest tests/ -v --cov=app --cov-report=term-missing
```

### Static Analysis & Linters
```bash
# Python linting and code style checks via Ruff
cd backend
ruff check .

# Static type checking via Mypy
mypy .

# Frontend TypeScript verification & production bundle validation
cd ../frontend
npm run build
```

---

## ☁️ Production Deployment

LabPilotAI is designed to run completely free across modern cloud providers:

| Layer | Provider | Free Tier Details |
| :--- | :--- | :--- |
| **Frontend** | [Vercel](https://vercel.com) | Unlimited Bandwidth, Global Edge CDN, Free SSL |
| **Backend API** | [Render](https://render.com) | Free Docker Web Service (512MB RAM, Auto-Deploy on Git Push) |
| **Database** | [Supabase](https://supabase.com) / [Neon](https://neon.tech) | 500 MB Free PostgreSQL with native `pgvector` support |
| **PDF Storage** | [Cloudflare R2](https://www.cloudflare.com/products/r2/) | 10 GB Free Storage, **$0 Egress/Bandwidth Fees** |
| **AI LLM** | [Google AI Studio](https://aistudio.google.com) | Free Gemini 2.5 Flash API allocation |

> 📖 **Complete Step-by-Step Walkthrough**: Read the comprehensive [**Free Deployment Guide**](./docs/FREE_DEPLOYMENT_GUIDE.md) to deploy your own production instance.

---

## 📄 License & Author

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.

Developed with ❤️ by **[Plash Sharma](https://github.com/Plash-Sharma)**.
