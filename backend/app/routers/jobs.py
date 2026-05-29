import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models import Job, Resume, Score
from app.schemas.schemas import JobCreate, JobResponse, JobSummaryResponse, CandidateSummary
from app.services.nlp import extract_skills_from_text
from app.services.parser import extract_text
from app.config import ALLOWED_EXTENSIONS, MAX_FILE_SIZE, UPLOAD_DIR
import shutil

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


@router.post("", response_model=JobResponse)
async def create_job(body: JobCreate, db: AsyncSession = Depends(get_db)):
    skills = extract_skills_from_text(body.description)
    job = Job(
        id=uuid.uuid4(),
        title=body.title or "Untitled",
        description=body.description,
        extracted_skills=skills,
    )
    db.add(job)
    await db.commit()
    return JobResponse(job_id=job.id, title=job.title, extracted_skills=skills)


@router.post("/upload", response_model=JobResponse)
async def upload_jd(
    title: str = "Uploaded JD",
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    ext = os.path.splitext(file.filename or ".pdf")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported format. Use PDF, DOC, or DOCX.")
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 5MB limit.")
    file_id = uuid.uuid4()
    file_path = os.path.join(UPLOAD_DIR, f"jd_{file_id}{ext}")
    with open(file_path, "wb") as f:
        f.write(content)
    description = extract_text(file_path)
    if not description.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from file.")
    skills = extract_skills_from_text(description)
    job = Job(
        id=uuid.uuid4(),
        title=title or file.filename or "Uploaded JD",
        description=description,
        extracted_skills=skills,
    )
    db.add(job)
    await db.commit()
    return JobResponse(job_id=job.id, title=job.title, extracted_skills=skills)


@router.get("", response_model=list[JobResponse])
async def list_jobs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Job).order_by(Job.created_at.desc()))
    jobs = result.scalars().all()
    return [JobResponse(job_id=j.id, title=j.title, extracted_skills=j.extracted_skills or []) for j in jobs]


@router.get("/summary", response_model=list[JobSummaryResponse])
async def list_jobs_summary(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Job).order_by(Job.created_at.desc()))
    jobs = result.scalars().all()
    summaries = []
    for job in jobs:
        scores_result = await db.execute(
            select(Score).where(Score.job_id == job.id).order_by(Score.total_score.desc())
        )
        scores = scores_result.scalars().all()
        scores_list = [s.total_score for s in scores]
        avg = sum(scores_list) / len(scores_list) if scores_list else 0
        top = max(scores_list) if scores_list else 0

        top_candidates = []
        top_name = None
        for s in scores[:3]:
            resume_result = await db.execute(select(Resume).where(Resume.id == s.resume_id))
            resume_obj = resume_result.scalar_one_or_none()
            if not resume_obj:
                continue
            candidate_name = resume_obj.file_name
            if resume_obj.parsed_data:
                candidate_name = resume_obj.parsed_data.get("name") or resume_obj.file_name
            candidate_summary = CandidateSummary(
                rank=s.rank or 0,
                candidate_name=candidate_name,
                score=round(s.total_score, 1),
            )
            top_candidates.append(candidate_summary)
            if not top_name:
                top_name = candidate_name

        count_result = await db.execute(
            select(func.count(Resume.id)).where(Resume.job_id == job.id)
        )
        candidate_count = count_result.scalar() or 0

        summaries.append(
            JobSummaryResponse(
                job_id=job.id,
                title=job.title,
                extracted_skills=job.extracted_skills or [],
                created_at=job.created_at,
                candidate_count=candidate_count,
                average_score=round(avg, 1),
                top_score=round(top, 1),
                top_candidate_name=top_name,
                top_candidates=top_candidates,
            )
        )
    return summaries


@router.delete("/{job_id}")
async def delete_job(job_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    job_uuid = job_id
    result = await db.execute(select(Job).where(Job.id == job_uuid))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    resumes_result = await db.execute(select(Resume).where(Resume.job_id == job_uuid))
    resumes = resumes_result.scalars().all()

    for resume in resumes:
        if os.path.exists(resume.file_path):
            os.remove(resume.file_path)

    await db.execute(Score.__table__.delete().where(Score.job_id == job_uuid))
    await db.execute(Resume.__table__.delete().where(Resume.job_id == job_uuid))
    await db.delete(job)
    await db.commit()

    return {"status": "deleted", "job_id": job_id}
