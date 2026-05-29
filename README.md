# Resume Screening & Candidate Ranking

A full-stack web app that automates resume screening — upload a job description, submit resumes (PDF/DOC/DOCX), and get each candidate scored 0–100 with ranked results, exportable to CSV or Excel.

---

## Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Backend:** FastAPI, SQLAlchemy (async), Pydantic
- **Database:** PostgreSQL (production) / SQLite (local dev)
- **NLP:** pdfminer.six, python-docx, olefile, scikit-learn (TF-IDF)
- **Deployment:** Render (Blueprint), Docker

---

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL (optional — SQLite works out of the box)

### 1. Install Backend

```bash
cd backend
pip install -r requirements.txt
```

### 2. Install Frontend

```bash
cd frontend
npm install
```

### 3. Run Locally

**Terminal 1 — Backend:**
```bash
cd backend
uvicorn app.main:app --reload
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open **http://localhost:3000**

To use PostgreSQL instead of SQLite:
```bash
# Windows (PowerShell)
$env:DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/resume_screening"

# Linux/macOS
export DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/resume_screening"
```

### 4. Run with Docker

```bash
docker-compose up
```

---

## Deployment (Render)

1. Push repo to GitHub.
2. Render Dashboard → **New → Blueprint**.
3. Connect repo — `render.yaml` provisions PostgreSQL + Backend + Frontend automatically.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/jobs` | Create job from pasted text |
| `POST` | `/api/jobs/upload` | Create job from uploaded file |
| `GET` | `/api/jobs` | List all jobs |
| `GET` | `/api/jobs/summary` | Jobs with candidate stats |
| `DELETE` | `/api/jobs/{jobId}` | Delete job + resumes + scores |
| `POST` | `/api/upload/resumes` | Upload resumes (max 50) |
| `POST` | `/api/screening/run` | Run screening |
| `GET` | `/api/screening/results/{jobId}` | Ranked results |
| `GET` | `/api/screening/export/{jobId}?format=csv\|xlsx` | Export CSV/Excel |
| `GET` | `/api/files/{resumeId}` | Download resume file |

---

## Project Structure

```
backend/
  app/
    main.py              # FastAPI app
    config.py            # DATABASE_URL, upload limits
    database.py          # Async engine + sessions
    models/db_models.py  # Job, Resume, Score ORM models
    schemas/schemas.py   # Pydantic models
    routers/             # jobs.py, upload.py, screening.py, files.py
    services/            # parser.py, nlp.py, scorer.py
  requirements.txt
frontend/
  pages/                 # index.tsx, screen.tsx, results/[jobId].tsx
  components/            # UI components
  utils/api.ts           # API client
  next.config.js
  package.json
render.yaml              # Render Blueprint (IaC)
docker-compose.yml
```
