# Resume Screening & Candidate Ranking

A full-stack web application that automates resume screening by comparing uploaded resumes against a Job Description (JD), generating a match score (0–100), and ranking candidates by relevance.

---

## Architecture

```
[Browser - Next.js Frontend]
        │  REST API calls
        ▼
[FastAPI Backend]
   ├── /api/jobs          → Create & list jobs (paste text or upload file)
   ├── /api/upload        → Upload resume files (PDF/DOC/DOCX)
   ├── /api/screening     → Run screening, get results, export CSV/Excel
   └── /api/files         → Serve stored resume files
        │
   [PostgreSQL / SQLite DB]   [File Storage: uploads/]
```

---

## Scoring Approach

Each resume is scored 0–100 across 4 weighted factors:

| Factor | Weight | Method |
|---|---|---|
| Skills Match | 40% | Jaccard similarity on extracted skill lists |
| Experience Relevance | 25% | Years comparison + role keyword overlap |
| Education Alignment | 15% | Degree level + field match |
| Keyword Similarity | 20% | TF-IDF cosine similarity (JD vs resume text) |

**Final Score Formula:**
```
score = (skills_match × 0.40) + (experience × 0.25) + (education × 0.15) + (keywords × 0.20)
```

---

## Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (optional — SQLite works out of the box)

### 1. Clone & Install Backend

```bash
cd backend
pip install -r requirements.txt
```

### 2. Install Frontend

```bash
cd frontend
npm install
```

### 3. Configure Database

**Default (SQLite — no setup needed):**
The app creates `backend/resume_screening.db` automatically.

**PostgreSQL:**
Set the `DATABASE_URL` env var:
```bash
# Windows PowerShell
$env:DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/resume_screening"

# Linux/macOS
export DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/resume_screening"
```

### 4. Run Locally

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

### 5. Run with Docker

```bash
docker-compose up
```

This provisions PostgreSQL + Backend + Frontend together.

---

## Deployment (Render)

1. Push the repo to GitHub.
2. In Render dashboard: **New → Blueprint**.
3. Connect your repo — Render reads `render.yaml` and provisions:
   - **PostgreSQL** database (free tier)
   - **Backend** web service (Python, auto-scaled)
   - **Frontend** web service (Node, with API URL auto-linked)

Alternatively, deploy each service manually:
- **Frontend**: Static Site (build `npm run build`, publish `out/`)
- **Backend**: Web Service (start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`)

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/jobs` | Create job from pasted text |
| `POST` | `/api/jobs/upload` | Create job from uploaded file |
| `GET` | `/api/jobs` | List all jobs |
| `GET` | `/api/jobs/summary` | List jobs with candidate stats |
| `DELETE` | `/api/jobs/{jobId}` | Delete job, resumes, and scores |
| `POST` | `/api/upload/resumes` | Upload resumes for a job |
| `POST` | `/api/screening/run` | Run screening for a job |
| `GET` | `/api/screening/results/{jobId}` | Get ranked results |
| `GET` | `/api/screening/export/{jobId}?format=csv` | Export CSV |
| `GET` | `/api/screening/export/{jobId}?format=xlsx` | Export Excel |

---

## Assumptions

- Users are trusted internal HR staff (no auth for MVP)
- English-language resumes only
- JD and resumes are text-readable (no scanned images)
- Up to 50 resumes per job posting for MVP

---

## Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Backend:** FastAPI, SQLAlchemy (async), Pydantic
- **Database:** PostgreSQL (production) / SQLite (local dev)
- **NLP:** pdfminer.six, python-docx, scikit-learn (TF-IDF)
