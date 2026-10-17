# 🚀 LabPilotAI - 100% Free Production Deployment Guide
> Deploy LabPilotAI completely free without Amazon AWS S3, using modern free-tier cloud platforms.

---

## 🏗️ 100% Free Cloud Architecture Overview

| Component | Free Platform | Free Quota | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend** | [Vercel](https://vercel.com) or [Cloudflare Pages](https://pages.cloudflare.com) | Unlimited Bandwidth, Global CDN, Free SSL | Vite React Single Page Application |
| **Backend API** | [Render](https://render.com) or [Railway](https://railway.app) / [Koyeb](https://koyeb.com) | Free Web Service (512MB RAM, Docker) | FastAPI + WeasyPrint PDF Generation |
| **Database** | [Supabase](https://supabase.com) or [Neon](https://neon.tech) | 500 MB PostgreSQL with `pgvector` | User auth, Lab records, Embeddings, MCQs |
| **Object Storage (No S3)** | [Cloudflare R2](https://www.cloudflare.com/products/r2/) | 10 GB Free Storage, **$0 Egress Fees** | S3-Compatible PDF Storage |
| **AI LLM** | [Google Gemini AI Studio](https://aistudio.google.com) | Free 15 Requests/Min | RAG Viva questions & Dynamic MCQ generation |

---

## 📋 Step 1: Set Up Free Database (Supabase with pgvector)

1. Go to [supabase.com](https://supabase.com) and create a free account.
2. Click **New Project** and name it `labpilotai`.
3. Set a strong database password and choose your nearest region.
4. Once created, go to **Project Settings** → **Database** → **Connection String** → select **URI**.
5. Copy the connection string. It looks like:
   ```
   postgresql://postgres.[PROJECT_REF]:[YOUR_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
6. In Supabase Dashboard, go to **SQL Editor** and run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

---

## 🪣 Step 2: Set Up Free Cloudflare R2 Storage (Replaces Amazon S3)

Cloudflare R2 provides a **100% S3-compatible API** with **10 GB storage free forever** and **zero egress/bandwidth fees**.

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) and navigate to **R2**.
2. Click **Create bucket** → name it: `labpilotai-pdfs`.
3. Click **Manage R2 API Tokens** → **Create API Token**:
   - Permission: **Object Read & Write**
   - Apply to: `labpilotai-pdfs`
4. Copy the generated credentials:
   - **Access Key ID**: `<YOUR_R2_ACCESS_KEY_ID>`
   - **Secret Access Key**: `<YOUR_R2_SECRET_ACCESS_KEY>`
   - **Endpoint URL**: `https://<YOUR_ACCOUNT_ID>.r2.cloudflarestorage.com`

---

## 🔑 Step 3: Get Free Google Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Click **Create API Key**.
3. Copy the key.

---

## 🖥️ Step 4: Deploy Backend API to Render (Free Tier)

1. Push this repository to your GitHub account (`git push origin main`).
2. Go to [dashboard.render.com](https://dashboard.render.com) and click **New +** → **Web Service**.
3. Connect your GitHub repository.
4. Configure the service:
   - **Name**: `labpilotai-api`
   - **Region**: Choose closest to you
   - **Language / Environment**: `Docker`
   - **Dockerfile Path**: `./backend/Dockerfile`
   - **Docker Context**: `./backend`
   - **Instance Type**: `Free`
5. Under **Environment Variables**, add:

| Key | Example Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql+asyncpg://postgres:pass@...` | From Supabase / Neon |
| `SECRET_KEY` | `generate-random-32-chars-secret` | JWT encryption key |
| `GEMINI_API_KEY` | `AIzaSy...` | From Google AI Studio |
| `S3_BUCKET_NAME` | `labpilotai-pdfs` | Cloudflare R2 Bucket name |
| `S3_ENDPOINT_URL` | `https://<account_id>.r2.cloudflarestorage.com` | Cloudflare R2 Endpoint |
| `AWS_ACCESS_KEY_ID` | `<R2_ACCESS_KEY>` | Cloudflare R2 Access Key |
| `AWS_SECRET_ACCESS_KEY` | `<R2_SECRET_KEY>` | Cloudflare R2 Secret Key |
| `AWS_REGION` | `auto` | Set to `auto` for Cloudflare R2 |
| `USE_CELERY` | `false` | Set `false` for free single-instance hosting |
| `CORS_ORIGINS` | `https://your-frontend.vercel.app,http://localhost:5173` | Allowed frontend domains |

6. Click **Deploy Web Service**.
7. Note down your backend URL (e.g. `https://labpilotai-api.onrender.com`).

---

## 🌐 Step 5: Deploy Frontend to Vercel (Free Tier)

1. Go to [vercel.com](https://vercel.com) and click **Add New...** → **Project**.
2. Select your `LabPilotAI` repository.
3. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
4. Under **Environment Variables**, add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://labpilotai-api.onrender.com/api/v1` (replace with your Render backend URL)
5. Click **Deploy**.
6. Once deployed, add your Vercel URL to your Render `CORS_ORIGINS` environment variable.

---

## 🧪 Step 6: Verify Live Deployment

1. Open your Vercel URL in your browser.
2. Click **Register** to create a test student account.
3. Navigate to **Create PDF**:
   - Add lab problem, code, and output.
   - Click **Create PDF Record**.
   - Verify PDF downloads cleanly.
4. Click **Take MCQ Skill Test**:
   - Choose 10, 12, or 15 questions.
   - Click **Generate New MCQ Test**.
   - Answer the questions and click **Submit Test**.
   - Check your instant score, skill level (Mastery / Proficient / Intermediate / Beginner), strengths/weaknesses breakdown, and explanations.
   - Click **Generate New Test (Different Questions)** to verify fresh questions on each run.

---

## 🛠️ Summary of Changes Made for Free Hosting

- **S3 Endpoint Override**: `StorageService` in `storage_service.py` supports `S3_ENDPOINT_URL`, making Cloudflare R2 and any S3-compatible free storage work natively without AWS S3.
- **Background Tasks Fallback**: `submissions.py` automatically uses FastAPI's built-in `BackgroundTasks` when Celery/Redis is not deployed, enabling zero-extra-container free deployments.
- **Dynamic Database Driver Support**: `database.py` automatically adapts standard `postgres://` URLs to `postgresql+asyncpg://` for Supabase/Neon.
- **Production Dockerfile**: `backend/Dockerfile` includes all required native WeasyPrint rendering libraries (`pango`, `cairo`, `fonts`).
- **SPA Routing Support**: `frontend/vercel.json` and `frontend/public/_redirects` ensure deep routes like `/mcq` and `/dashboard` refresh without 404 errors.
