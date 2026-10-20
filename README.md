# LabPilotAI

Technical Documentation and Architecture Overview

LabPilotAI is an engineering laboratory record automation, vector search (RAG) examination, and adaptive diagnostic assessment platform. It ingests source code, algorithmic problem definitions, and execution outputs, compiling them into institutional-standard PDF reports with tokenized syntax highlighting. Concurrently, it vectorizes experiment documentation into a vector database, enabling retrieval-augmented generation (RAG) for viva voce oral examination prep and adaptive technical multiple-choice assessments.

---

## Table of Contents

- [1. System Overview and Core Concepts](#1-system-overview-and-core-concepts)
- [2. Technology Stack](#2-technology-stack)
- [3. Architecture and Data Flow](#3-architecture-and-data-flow)
- [4. Repository and Component Structure](#4-repository-and-component-structure)
- [5. Database Schema and Data Models](#5-database-schema-and-data-models)
- [6. Core Engineering Subsystems](#6-core-engineering-subsystems)
  - [6.1 Automated PDF Compilation Engine](#61-automated-pdf-compilation-engine)
  - [6.2 RAG Vector Indexing and Viva AI Tutor](#62-rag-vector-indexing-and-viva-ai-tutor)
  - [6.3 Adaptive MCQ Diagnostic Generator](#63-adaptive-mcq-diagnostic-generator)
  - [6.4 Security Architecture and Threat Mitigation](#64-security-architecture-and-threat-mitigation)
  - [6.5 Client-Side Architecture and Caching](#65-client-side-architecture-and-caching)
- [7. REST API Reference](#7-rest-api-reference)
- [8. Local Setup and Development](#8-local-setup-and-development)
- [9. Configuration and Environment Variables](#9-configuration-and-environment-variables)
- [10. Testing and Quality Assurance](#10-testing-and-quality-assurance)
- [11. Production Deployment Guide](#11-production-deployment-guide)
- [12. Future Roadmap & Upcoming Features](#12-future-roadmap--upcoming-features)
- [13. License](#13-license)

---

## 1. System Overview and Core Concepts

### Problem Scope
In academic computer science and engineering coursework, practical laboratory records require significant manual formatting: structuring problem statements, embedding source code with language-appropriate indentation, attaching execution outputs, and maintaining institutional header standards across semesters. When preparation for practical viva voce assessments and oral examinations occurs, students lack automated, concept-grounded evaluation tools tailored to their specific laboratory submissions.

### Engineering Solution
LabPilotAI automates both documentation generation and conceptual assessment through a unified backend and frontend architecture:
- **Declarative PDF Compilation**: Converts JSON-structured or raw problem inputs into standardized academic PDF records using Jinja2 templates, Pygments lexical tokenizers, and WeasyPrint CSS Paged Media.
- **RAG-Grounded Viva Voce Simulation**: Ingests compiled PDF documents, divides them into semantic chunks, generates 768-dimensional embeddings using Google Gemini (`gemini-embedding-001`), and indexes them in PostgreSQL via `pgvector` for conversational oral exam tutoring.
- **Dynamic Diagnostic Assessments**: Generates 10 to 15 non-repeating multiple-choice questions balanced across three conceptual difficulty tiers (Easy, Medium, Hard), with real-time scoring, analytical proficiency classification, and conceptual diagnostics.
- **Course Portfolio Concatenation**: Assembles multiple laboratory experiments belonging to a given session or semester into a single indexed PDF binder.

---

## 2. Technology Stack

### Frontend Application
- **Framework**: React 18.2.0 with TypeScript 5.2+
- **Build System**: Vite 5.2 (Native ESModules, fast HMR, production minification)
- **Styling Architecture**: Tailwind CSS 4.0 / PostCSS with CSS variable design tokens
- **Routing**: React Router DOM 7.18
- **Iconography**: Lucide React
- **State & Data Management**: Custom React Contexts (`AuthContext`, `ThemeContext`), in-memory SWR-style caching, and optimistic client updates

### Backend Services
- **Framework**: FastAPI 0.110+ (Asynchronous ASGI framework, Python 3.12+)
- **Server**: Uvicorn (Development) / Gunicorn (Production)
- **Data Serialization & Validation**: Pydantic v2 and Pydantic-Settings
- **Database Layer**: SQLAlchemy 2.0 (AsyncIO) with `asyncpg` driver
- **Database Migrations**: Alembic
- **Asynchronous Task Queue (Optional)**: Celery 5.3 with Redis 7 broker for high-throughput background PDF compilation

### Persistence and Vector Database
- **Relational Database**: PostgreSQL 16
- **Vector Extension**: `pgvector` (768-dimensional vector indexing)
- **In-Memory Store / Broker**: Redis 7

### Document Generation Pipeline
- **Rendering Engine**: WeasyPrint (Paged Media CSS3, HTML-to-PDF compiler)
- **Template Engine**: Jinja2
- **Syntax Highlighting**: Pygments (Dynamic lexer resolution for C++, Python, Java, JavaScript)
- **Document Processing**: PyPDF2 (Binary text extraction and multi-page concatenation)

### Artificial Intelligence & Machine Learning
- **Large Language Models**: Google Gemini (`gemini-2.5-flash`, `gemini-3.5-flash-lite`) via `google-genai` SDK
- **Embeddings Engine**: Google GenAI `gemini-embedding-001` (768-dimensional output vectors)

### Infrastructure and Deployment
- **Containerization**: Docker, Docker Compose
- **Cloud Infrastructure**: Vercel (Frontend CDN), Render (Backend Container), Supabase / Neon (Managed PostgreSQL with pgvector), Cloudflare R2 (S3-compatible zero-egress PDF storage)
- **Continuous Integration**: GitHub Actions (Linting, static analysis, unit tests, bundle verification)

---

## 3. Architecture and Data Flow

```mermaid
flowchart TD
    subgraph Client ["Client Layer (React 18 + TypeScript SPA)"]
        UI[User Interface]
        ClientAPI[Type-Safe API Client]
        Cache[In-Memory SWR Cache]
    end

    subgraph API_Gateway ["FastAPI Gateway (/api/v1)"]
        Router[API Router]
        AuthGuard[OAuth2 / JWT Bearer Guard]
        RateLimiter[Sliding Window Rate Limiter]
        CORS[CORS Middleware]
    end

    subgraph Application_Services ["Core Services"]
        PDFService[PDF Compiler Service]
        RAGService[RAG & Viva Tutor Service]
        MCQService[Adaptive MCQ Service]
        MergeService[PDF Binder Assembly Service]
        StorageService[Storage Abstraction S3 / R2 / Local]
    end

    subgraph Vector_and_Data ["Persistence Layer"]
        Postgres[(PostgreSQL 16)]
        PGVector[(pgvector 768-dim Vectors)]
        LocalFS[(Local Storage Volume)]
        R2[(Cloudflare R2 Object Storage)]
    end

    subgraph AI_Engine ["Google Gemini AI"]
        EmbedAPI[gemini-embedding-001]
        LLMAPI[gemini-2.5-flash / gemini-3.5-flash-lite]
    end

    UI --> ClientAPI
    ClientAPI <--> Cache
    ClientAPI -->|REST + Bearer Token| CORS
    CORS --> RateLimiter
    RateLimiter --> Router
    Router --> AuthGuard

    AuthGuard --> PDFService
    AuthGuard --> RAGService
    AuthGuard --> MCQService
    AuthGuard --> MergeService

    PDFService -->|Jinja2 + WeasyPrint + Pygments| StorageService
    StorageService --> LocalFS
    StorageService --> R2

    RAGService -->|Extract Text| PDFService
    RAGService -->|Generate 768-dim Embeddings| EmbedAPI
    EmbedAPI -->|Store Vectors| PGVector
    RAGService -->|Ground Context + Prompts| LLMAPI

    MCQService -->|Question Synthesis & Scoring| LLMAPI
    MergeService -->|Concatenate PDFs| StorageService

    Router --> Postgres
```

---

## 4. Repository and Component Structure

```text
LabPilotAI/
├── .github/
│   └── workflows/
│       ├── ci.yml                  # Continuous integration (Ruff, pytest, tsc, vite build)
│       └── deploy.yml              # Automated deployment pipeline
├── backend/
│   ├── alembic/                    # Schema migration scripts
│   │   ├── versions/
│   │   │   ├── e1329459c1a0_initial_migration.py
│   │   │   ├── 6aa81d5286be_add_vector_and_phase_3_models.py
│   │   │   ├── 257764537761_add_password_hash.py
│   │   │   ├── 7bb92e64889c_add_mcq_models.py
│   │   │   └── 8cc91a23b45e_add_user_profile_and_submission_meta.py
│   │   └── env.py
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py             # Database and security dependency injection
│   │   │   └── routes/
│   │   │       ├── auth.py         # Registration, authentication, password reset
│   │   │       ├── execution.py    # Code execution policy and runner interface
│   │   │       ├── mcq.py          # MCQ test generation, submission, and analytics
│   │   │       ├── rag.py          # RAG question generation and conversational chat
│   │   │       ├── sessions.py     # Lab session management and binder merging
│   │   │       ├── submissions.py  # Lab experiment ingestion and PDF endpoints
│   │   │       └── templates.py    # Academic PDF template catalog
│   │   ├── core/
│   │   │   ├── database.py         # AsyncIO database engine and session factory
│   │   │   ├── rate_limit.py       # Sliding-window in-memory rate limiter
│   │   │   └── seed.py             # Baseline template data seeder
│   │   ├── models/
│   │   │   └── models.py           # SQLAlchemy declarative ORM entities
│   │   ├── schemas/
│   │   │   └── schemas.py          # Pydantic v2 request/response contracts
│   │   ├── services/
│   │   │   ├── mcq_service.py      # Diagnostic MCQ generation and scoring
│   │   │   ├── merge_service.py    # Multi-PDF concatenation service
│   │   │   ├── pdf_service.py      # WeasyPrint, Pygments, and Jinja2 pipeline
│   │   │   ├── rag_service.py      # Semantic chunking, pgvector search, and tutoring
│   │   │   └── storage_service.py  # S3, Cloudflare R2, and local storage provider
│   │   ├── templates/              # Institutional PDF HTML layouts
│   │   │   ├── generic_minimal.html
│   │   │   └── nit_jalandhar_default.html
│   │   └── main.py                 # FastAPI application factory, CORS, and routing
│   ├── tests/
│   │   ├── integration/            # API integration tests
│   │   └── unit/                   # Service-level unit tests
│   ├── Dockerfile                  # Production container definition (Debian/Python 3.12)
│   ├── pyproject.toml              # Ruff, mypy, and pytest configurations
│   └── requirements.txt            # Python dependencies
├── frontend/
│   ├── public/                     # Static assets and site icons
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts           # Type-safe API client with in-memory caching
│   │   ├── components/
│   │   │   ├── AuthForms.tsx       # Authentication, registration, and reset views
│   │   │   ├── CustomSelect.tsx    # Accessible dropdown selector component
│   │   │   ├── LabPilotLogo.tsx    # Vector logo component
│   │   │   └── PasswordRequirements.tsx # Password complexity checklist component
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx     # JWT state management and token lifecycle
│   │   │   └── ThemeContext.tsx    # Dark/light theme state and persistence
│   │   ├── pages/
│   │   │   ├── ChangePassword.tsx  # In-session credential updater
│   │   │   ├── Dashboard.tsx       # Lab report management, filters, and binder download
│   │   │   ├── MCQTest.tsx         # Diagnostic quiz interface and analytics
│   │   │   ├── Profile.tsx         # Student profile and institutional credentials
│   │   │   ├── SubmitLab.tsx       # Lab report editor and compilation trigger
│   │   │   └── VivaPrep.tsx        # Conversational oral examination simulator
│   │   ├── App.tsx                 # Layout shell, navigation drawer, and router
│   │   ├── index.css               # Design system definitions and CSS variables
│   │   └── main.tsx                # Client DOM entrypoint
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── docs/
│   └── FREE_DEPLOYMENT_GUIDE.md    # Production deployment documentation
├── infra/
│   ├── docker-compose.yml          # PostgreSQL 16 (pgvector) + Redis 7 infrastructure
│   └── main.tf                     # Cloud infrastructure automation
├── render.yaml                     # Render.com deployment blueprint
├── LICENSE                         # MIT License
└── README.md
```

---

## 5. Database Schema and Data Models

### Entity Relationship Structure
The database uses PostgreSQL 16 with UUID primary keys and foreign key constraints:

```text
users (id PK)
├── lab_sessions (id PK, user_id FK -> users.id)
│   └── submissions (id PK, lab_session_id FK -> lab_sessions.id)
├── submissions (id PK, user_id FK -> users.id, template_id FK -> templates.id)
│   ├── document_chunks (id PK, submission_id FK -> submissions.id, embedding Vector(768))
│   ├── viva_questions (id PK, submission_id FK -> submissions.id)
│   └── mcq_tests (id PK, submission_id FK -> submissions.id, user_id FK -> users.id)
│       ├── mcq_questions (id PK, test_id FK -> mcq_tests.id)
│       └── mcq_attempts (id PK, test_id FK -> mcq_tests.id, user_id FK -> users.id)
└── templates (id PK)
```

### Table Specifications

#### `users`
- `id` (UUID, Primary Key)
- `email` (String, Unique, Indexed)
- `password_hash` (String, BCrypt)
- `name` (String)
- `college` (String)
- `college_logo` (Text, Base64 data URI, Nullable)
- `roll_number` (String, Nullable)
- `reset_token` (String, Nullable)
- `reset_token_expires` (DateTime, Nullable)

#### `submissions`
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key -> `users.id`, Cascading Delete)
- `lab_session_id` (UUID, Foreign Key -> `lab_sessions.id`, Nullable)
- `template_id` (UUID, Foreign Key -> `templates.id`)
- `aim` (Text)
- `algorithm` (Text)
- `code` (Text, stores raw code string or serialized multi-problem JSON)
- `output` (Text)
- `result` (Text)
- `filename` (String, Unique per user)
- `date_of_lab` (String, Nullable)
- `subject_of_lab` (String, Nullable)
- `subject_code` (String, Nullable)
- `group_name` (String, Nullable)
- `batch_name` (String, Nullable)
- `teacher_name` (String, Nullable)
- `include_logo` (Boolean, Default: True)
- `status` (String: `pending`, `ready`, `failed`)
- `pdf_url` (String, Nullable: S3 URI or local reference)
- `created_at` (DateTime, Default: UTC Now)

#### `document_chunks`
- `id` (UUID, Primary Key)
- `submission_id` (UUID, Foreign Key -> `submissions.id`, Cascading Delete)
- `content` (Text, 1,000-character partition)
- `embedding` (`Vector(768)`, indexed for Cosine similarity)

#### `mcq_tests`
- `id` (UUID, Primary Key)
- `submission_id` (UUID, Foreign Key -> `submissions.id`, Cascading Delete)
- `user_id` (UUID, Foreign Key -> `users.id`, Cascading Delete)
- `title` (String)
- `topic` (String, Nullable)
- `total_questions` (Integer, Default: 10)
- `created_at` (DateTime, Default: UTC Now)

#### `mcq_questions`
- `id` (UUID, Primary Key)
- `test_id` (UUID, Foreign Key -> `mcq_tests.id`, Cascading Delete)
- `order_index` (Integer)
- `question_text` (Text)
- `options` (JSON array of 4 choices)
- `correct_index` (Integer: 0, 1, 2, or 3)
- `explanation` (Text)
- `difficulty` (String: `easy`, `medium`, `hard`)
- `concept` (String)

#### `mcq_attempts`
- `id` (UUID, Primary Key)
- `test_id` (UUID, Foreign Key -> `mcq_tests.id`, Cascading Delete)
- `user_id` (UUID, Foreign Key -> `users.id`, Cascading Delete)
- `score` (Integer)
- `total_questions` (Integer)
- `percentage` (Float)
- `level` (String: `Mastery`, `Proficient`, `Intermediate`, `Beginner`)
- `feedback` (Text)
- `analysis` (JSON: concept breakdown, strengths, weaknesses, recommendations)
- `selected_answers` (JSON: `{ question_id: option_index }`)
- `created_at` (DateTime, Default: UTC Now)

---

## 6. Core Engineering Subsystems

### 6.1 Automated PDF Compilation Engine
1. **Input Normalization**: Ingests either single experiments or JSON arrays containing multiple programming problems.
2. **Lexical Tokenization**: Pygments identifies source language and generates HTML tokens matching a structured CSS color definition.
3. **Template Compilation**: Jinja2 populates institutional templates (`nit_jalandhar_default.html`, `generic_minimal.html`) with student metadata, college logos, algorithmic steps, formatted code blocks, and execution outputs.
4. **Paged Media Formatting**: WeasyPrint parses CSS Paged Media specifications (`@page`, running headers/footers, orphan/widow controls) and renders PDF documents.
5. **Storage Dispatch**: Files are written to local disk storage (`storage/`) or dispatched to Cloudflare R2 / AWS S3 via Boto3.

### 6.2 RAG Vector Indexing and Viva AI Tutor
1. **Extraction and Chunking**: `PyPDF2` extracts plain text from generated PDF files. Documents are partitioned into 1,000-character contiguous semantic windows.
2. **Vector Embeddings**: Each chunk is embedded through `gemini-embedding-001`, yielding a 768-dimensional float array stored in PostgreSQL `pgvector`.
3. **Oral Exam Tutoring**: `/submissions/{id}/chat` initiates an interactive conversational examination grounded in the student's submission. Prompts strictly constrain mathematical notation to clean backticks and plain text, preventing raw LaTeX syntax errors.
4. **Algorithmic Heuristics**: If the Gemini API is unreachable, a rule-based analyzer evaluates the code structure (detecting sorting algorithms, recursion, search loops, or trees) to produce grounded viva questions without external calls.

### 6.3 Adaptive MCQ Diagnostic Generator
1. **Non-Repeating Synthesis**: The generator queries existing question texts (`get_existing_question_texts`) associated with the lab submission to prevent duplicate questions on subsequent test runs.
2. **Tiered Difficulty**: Distributes questions across Easy (syntax, expected output), Medium (algorithm tracing, branching), and Hard (boundary conditions, asymptotic analysis).
3. **Automated Grading & Diagnostics**: Evaluates student submissions against correct indices, calculating aggregate accuracy, concept-specific accuracy percentages, strengths and weaknesses, and proficiency tiers.

### 6.4 Security Architecture and Threat Mitigation

#### Code Execution Policy
- **Elimination of Host Arbitrary Execution**: Server-side subprocess execution (`subprocess.run` on python, g++, javac) is disabled by default in production (`ENABLE_SERVER_EXECUTION=false`). This prevents remote code execution (RCE), host environment variable inspection (`DATABASE_URL`, `GEMINI_API_KEY`, `SECRET_KEY`), and denial-of-service via resource exhaustion.
- **External Sandbox Delegation**: Remote execution requests can be routed to an isolated, unprivileged container engine (e.g. private Piston or Judge0 instances via `PISTON_API_URL`).
- **Stripped Environment in Testing**: If server execution is enabled in an isolated test container, the subprocess environment is strictly stripped (`PATH` and `LANG` only), eliminating access to credentials.
- **Access Control and Throttling**: Execution requires valid JWT authentication (`Depends(get_current_user)`) and is throttled by a sliding-window rate limiter.

#### Password Recovery Hardening
- **Email-Only Token Delivery**: `/auth/forgot-password` dispatches single-use reset links exclusively through SMTP email. No tokens or URLs are returned in API response bodies.
- **Host Header Poisoning Immunity**: The reset link is constructed solely using the trusted server-side `FRONTEND_URL` environment variable, ignoring client-supplied `Origin` or `Referer` headers.
- **User Enumeration Defense**: The endpoint returns an identical generic response (`"If an account exists with this email address, a password reset link has been sent to your inbox."`) whether the email exists in the database or not.
- **Sliding-Window Rate Limiting**: Enforces a strict limit (max 5 requests per 10 minutes per client IP) via `forgot_password_limiter` to protect against mail server flooding and brute force attacks.
- **Single-Use Tokens**: Tokens are generated via `secrets.token_urlsafe(32)` with a 15-minute expiration time, and are nullified immediately upon password reset.

### 6.5 Client-Side Architecture and Caching
- **In-Memory Cache**: User profile data and template lists are stored in an in-memory cache to eliminate repetitive network roundtrips during navigation.
- **Form Persistence**: Authentication switching cleanly purges residual error and status messages.
- **Responsive Layout**: Desktop sidebar navigation collapses into a slide-out drawer on viewports below 768px.

---

## 7. REST API Reference

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/auth/register` | No | Creates student account with optional college logo upload |
| `POST` | `/auth/login` | No | Authenticates credentials and returns JWT bearer token |
| `GET` | `/auth/me` | Yes | Retrieves profile of currently authenticated user |
| `POST` | `/auth/forgot-password` | No | Rate-limited password reset trigger; dispatches email |
| `POST` | `/auth/reset-password` | No | Validates 15-minute token, verifies complexity, updates hash |
| `POST` | `/auth/change-password` | Yes | Authenticated password change validating previous password |

### Lab Submissions (`/api/v1/submissions`)
| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/submissions` | Yes | Ingests lab experiment and triggers PDF compilation |
| `GET` | `/submissions` | Yes | Lists all laboratory records belonging to current user |
| `GET` | `/submissions/{id}` | Yes | Retrieves submission status, metadata, and PDF URL |
| `DELETE`| `/submissions/{id}` | Yes | Deletes record, unlinks PDF file, cascades associated tests |
| `GET` | `/submissions/{id}/view` | No | In-browser inline PDF stream for modal preview |
| `GET` | `/submissions/{id}/download` | No | Attachment stream with sanitized Content-Disposition header |

### Sessions and Merging (`/api/v1/sessions`)
| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/sessions` | Yes | Creates a subject/semester course grouping |
| `GET` | `/sessions` | Yes | Lists all sessions for current user |
| `GET` | `/sessions/{id}` | Yes | Retrieves specific session and linked submissions |
| `GET` | `/sessions/{id}/merge` | Yes | Concatenates all ready session PDFs into an indexed binder |

### Code Execution (`/api/v1/execute`)
| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/execute` | Yes | Rate-limited code runner; delegates to external runner or fails safely |

### RAG & Viva AI Tutor (`/api/v1/submissions`)
| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/submissions/{id}/generate-questions` | Yes | Generates 5 viva questions via Gemini RAG with fallback |
| `GET` | `/submissions/{id}/questions` | Yes | Retrieves previously generated viva questions |
| `POST` | `/submissions/{id}/chat` | Yes | Interactive viva examination tutoring conversation |

### Adaptive MCQ Engine (`/api/v1`)
| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/submissions/{id}/mcq/generate` | Yes | Synthesizes 10–15 non-repeating diagnostic MCQs |
| `GET` | `/submissions/{id}/mcq/tests` | Yes | Lists all MCQ tests generated for a lab report |
| `GET` | `/mcq/tests/{test_id}` | Yes | Retrieves test questions (answers concealed) |
| `POST` | `/mcq/tests/{test_id}/submit` | Yes | Evaluates answers, records score, returns analytics |
| `GET` | `/mcq/tests/{test_id}/attempts` | Yes | Lists historical test attempt summaries |
| `GET` | `/mcq/attempts/{attempt_id}` | Yes | Retrieves detailed attempt review with explanations |
| `DELETE`| `/mcq/tests/{test_id}` | Yes | Deletes an MCQ test and associated attempt history |

### Templates (`/api/v1/templates`)
| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/templates` | No | Lists available institutional layout templates |
| `GET` | `/templates/{id}` | No | Retrieves template layout configuration |

---

## 8. Local Setup and Development

### Prerequisites
- Python 3.12 or higher
- Node.js 20 or higher, with npm
- Docker Desktop (for PostgreSQL with `pgvector` and Redis)
- Windows Users: MSYS2 with `mingw-w64-ucrt-x86_64-pango` installed for WeasyPrint support

---

### Step 1: Clone Repository
```bash
git clone https://github.com/Plash-Sharma/LabPilotAI.git
cd LabPilotAI
```

---

### Step 2: Launch Infrastructure (Docker)
Start PostgreSQL (with `pgvector` pre-configured on port 5433) and Redis (on port 6379):
```bash
cd infra
docker-compose up -d
cd ..
```

---

### Step 3: Backend Setup

1. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell)
   python -m venv .venv
   .venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv .venv
   source .venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

3. (Windows Only) Register Pango/Cairo binaries in system PATH:
   ```powershell
   $env:PATH = "C:\msys64\ucrt64\bin;" + $env:PATH
   ```

4. Configure environment:
   Create `backend/.env`:
   ```ini
   DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5433/labpilotai
   SECRET_KEY=dev-secret-key-change-in-production
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=10080
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-2.5-flash
   CORS_ORIGINS=http://localhost:5173,http://localhost:5174
   FRONTEND_URL=http://localhost:5173
   ENABLE_SERVER_EXECUTION=false
   ```

5. Apply database migrations and seed baseline templates:
   ```bash
   cd backend
   alembic upgrade head
   python -m app.core.seed
   ```

6. Start API server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   - API Root: `http://localhost:8000`
   - Swagger Documentation: `http://localhost:8000/docs`

---

### Step 4: Frontend Setup

1. Install npm packages:
   ```bash
   cd frontend
   npm install
   ```

2. Configure environment:
   Create `frontend/.env`:
   ```ini
   VITE_API_URL=http://localhost:8000/api/v1
   ```

3. Launch Vite development server:
   ```bash
   npm run dev
   ```
   - Application Interface: `http://localhost:5173`

---

## 9. Configuration and Environment Variables

### Backend Configuration (`backend/.env`)

| Variable | Required | Description | Default / Example |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | Yes | PostgreSQL connection string (`asyncpg`) | `postgresql+asyncpg://postgres:postgres@localhost:5433/labpilotai` |
| `SECRET_KEY` | Yes | Secret cryptographic key for JWT signing | 64-character random string |
| `ALGORITHM` | No | JWT signing algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | Validity duration of access tokens | `10080` (7 days) |
| `GEMINI_API_KEY` | Yes | Google Gemini API key for RAG & MCQs | Obtain from Google AI Studio |
| `GEMINI_MODEL` | No | LLM model identifier | `gemini-2.5-flash` or `gemini-3.5-flash-lite` |
| `CORS_ORIGINS` | No | Permitted CORS origins (comma-separated) | `http://localhost:5173,https://lab-pilot-ai.vercel.app` |
| `FRONTEND_URL` | No | Trusted frontend base URL for reset links | `https://lab-pilot-ai.vercel.app` |
| `ENABLE_SERVER_EXECUTION` | No | Enable server-side subprocess execution | `false` (Disabled for security) |
| `PISTON_API_URL` | No | Isolated external Piston runner endpoint | `http://localhost:2000` |
| `SMTP_HOST` | No | SMTP mail server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | No | SMTP port (587 TLS / 465 SSL) | `587` |
| `SMTP_USER` | No | SMTP authentication username / address | `noreply@labpilotai.com` |
| `SMTP_PASSWORD` | No | SMTP authentication password / token | `app-specific-password` |
| `SMTP_FROM` | No | Sender display email | `noreply@labpilotai.com` |
| `SMTP_TLS` | No | Enable TLS encryption | `true` |
| `S3_BUCKET_NAME` | No | Cloudflare R2 / AWS S3 bucket name | `labpilotai-pdfs` |
| `S3_ENDPOINT_URL` | No | Cloudflare R2 S3 endpoint URL | `https://<account-id>.r2.cloudflarestorage.com` |
| `AWS_ACCESS_KEY_ID` | No | Cloudflare R2 / S3 access key ID | String |
| `AWS_SECRET_ACCESS_KEY` | No | Cloudflare R2 / S3 secret access key | String |
| `AWS_REGION` | No | Object storage region | `auto` |

### Frontend Configuration (`frontend/.env`)

| Variable | Required | Description | Default |
| :--- | :---: | :--- | :--- |
| `VITE_API_URL` | Yes | Base URL of the backend API v1 endpoints | `http://localhost:8000/api/v1` |

---

## 10. Testing and Quality Assurance

### Run Backend Unit and Integration Tests
```bash
cd backend

# Execute unit tests
pytest tests/unit/ -v

# Execute complete test suite with coverage reporting
pytest tests/ -v --cov=app --cov-report=term-missing
```

### Static Analysis and Linting
```bash
# Python linting and formatting via Ruff
cd backend
ruff check .

# Static type checking via Mypy
mypy .

# Frontend TypeScript compilation and production bundle build check
cd ../frontend
npm run build
```

---

## 11. Production Deployment Guide

LabPilotAI is designed to run on zero-cost cloud tiers:

- **Frontend Application**: Deployed to Vercel or Cloudflare Pages (Connected to `main` branch, build command: `npm run build`, output directory: `dist`).
- **Backend API Web Service**: Deployed to Render or Railway via root `Dockerfile` using Python 3.12 slim bookworm with WeasyPrint system packages pre-installed.
- **Database**: Managed PostgreSQL with native `pgvector` support hosted on Supabase or Neon.
- **Object Storage**: S3-compatible, zero-egress PDF file storage on Cloudflare R2.
- **AI Processing**: Google AI Studio Gemini API free tier.

For detailed cloud configuration instructions, refer to [docs/FREE_DEPLOYMENT_GUIDE.md](docs/FREE_DEPLOYMENT_GUIDE.md).

---

## 12. Future Roadmap & Upcoming Features

LabPilotAI is actively evolving to support advanced laboratory workflows, collaborative learning, and LMS integrations. The following capabilities are scheduled for upcoming release phases:

| # | Feature | Architectural Scope & Target Capabilities |
| :---: | :--- | :--- |
| **01** | **Interactive Template Visual Editor** | In-browser WYSIWYG and code-based template editor empowering students and university faculties to design, customize, and export custom academic PDF layouts. Includes customizable border styles, college crest uploaders, faculty signature blocks, and department-specific grading criteria. |
| **02** | **Hierarchical File & Lab Folder Directory** | Dedicated workspace filesystem for comprehensive lab record management. Allows students to organize experiments into nested directories sorted by **Academic Year**, **Semester**, **Course Subject** (e.g., *Data Structures*, *OS*, *Database Systems*), and **Lab Batch**, with tagging, search, and batch PDF exports. |
| **03** | **Direct Google Classroom LMS Integration** | Native Google Classroom API integration with OAuth2 authentication. Enables students to connect their university Google account, view active lab assignments, and turn in compiled lab reports with their generated PDFs directly from LabPilotAI without manual downloads. |
| **04** | **End-of-Semester Multi-Lab Report Stitcher** | Automatic document concatenation and binding engine that merges all semester experiment submissions into a single master university lab manual. Features auto-generated dynamic Table of Contents, continuous page numbering, and an institutional semester title sheet for final university evaluations. |
| **05** | **In-Browser PDF Annotation & Editor** | Built-in canvas-based PDF editing suite. Allows students and evaluators to annotate code listings, insert geometric algorithm diagrams and state machine flowcharts, append professor review notes, sign pages digitally, and redact confidential details. |
| **06** | **Collaborative Lab Chatrooms & Study Groups** | Real-time WebSocket-powered collaboration spaces. Students can form subject-specific lab study groups, troubleshoot compiler errors and algorithms in a shared sandbox, conduct peer reviews, and prepare for oral viva voce examinations together. |

---

## 13. License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for terms.
