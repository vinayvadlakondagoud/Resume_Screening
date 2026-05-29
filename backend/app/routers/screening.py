import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import io
import csv
from app.database import get_db
from app.models import Job, Resume, Score
from app.schemas.schemas import ScreeningStart, ScreeningStatus, ResultsResponse, CandidateResult
from app.services.scorer import compute_and_store_scores
from app.services.nlp import parse_resume_data

router = APIRouter(prefix="/api/screening", tags=["screening"])


@router.post("/run", response_model=ScreeningStatus)
async def run_screening(
    body: ScreeningStart,
    db: AsyncSession = Depends(get_db),
):
    job_id = body.job_id
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    old = await db.execute(select(Score).where(Score.job_id == job_id))
    for s in old.scalars().all():
        db.delete(s)

    resumes_result = await db.execute(select(Resume).where(Resume.job_id == job_id))
    resumes = resumes_result.scalars().all()

    for resume in resumes:
        if not resume.parsed_data:
            parsed = parse_resume_data(resume.raw_text or "")
            resume.parsed_data = parsed
            db.add(resume)
        compute_and_store_scores(db, job, resume)

    await db.commit()

    scores_result = await db.execute(
        select(Score).where(Score.job_id == job_id).order_by(Score.total_score.desc())
    )
    all_scores = scores_result.scalars().all()
    for rank, score_obj in enumerate(all_scores, start=1):
        score_obj.rank = rank
        db.add(score_obj)

    await db.commit()

    return ScreeningStatus(status="completed", task_id=uuid.uuid4())


@router.get("/results/{job_id}", response_model=ResultsResponse)
async def get_results(
    job_id: uuid.UUID,
    min_score: float = Query(0.0),
    search: str = Query(""),
    db: AsyncSession = Depends(get_db),
):
    job_uuid = job_id
    result = await db.execute(select(Job).where(Job.id == job_uuid))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    scores_result = await db.execute(
        select(Score).where(Score.job_id == job_uuid).order_by(Score.total_score.desc())
    )
    scores = scores_result.scalars().all()

    candidates = []
    for s in scores:
        if s.total_score < min_score:
            continue

        resume_result = await db.execute(select(Resume).where(Resume.id == s.resume_id))
        resume = resume_result.scalar_one_or_none()
        if not resume:
            continue

        name = resume.file_name
        if resume.parsed_data:
            name = resume.parsed_data.get("name") or resume.file_name
        preview = ""
        if resume.raw_text:
            preview = resume.raw_text[:300].strip()

        if search and search.lower() not in name.lower():
            continue

        candidates.append(
            CandidateResult(
                rank=s.rank or 0,
                candidate_name=name,
                score=round(s.total_score, 1),
                matching_skills=s.matching_skills or [],
                missing_skills=s.missing_skills or [],
                resume_url=f"/api/files/{resume.id}",
                resume_preview=preview,
                skills_score=round(s.skills_score, 1),
                experience_score=round(s.experience_score, 1),
                education_score=round(s.education_score, 1),
                keyword_score=round(s.keyword_score, 1),
            )
        )

    scores_list = [c.score for c in candidates]
    avg_score = sum(scores_list) / len(scores_list) if scores_list else 0
    top_score = max(scores_list) if scores_list else 0

    return ResultsResponse(
        job_id=job_uuid,
        job_title=job.title,
        candidates=candidates,
        total=len(candidates),
        average_score=round(avg_score, 1),
        top_score=round(top_score, 1),
    )


@router.get("/export/{job_id}")
async def export_results(
    job_id: uuid.UUID,
    format: str = Query("csv"),
    db: AsyncSession = Depends(get_db),
):
    job_uuid = job_id
    scores_result = await db.execute(
        select(Score).where(Score.job_id == job_uuid).order_by(Score.total_score.desc())
    )
    scores = scores_result.scalars().all()

    rows = []
    for s in scores:
        resume_result = await db.execute(select(Resume).where(Resume.id == s.resume_id))
        resume = resume_result.scalar_one_or_none()
        if resume:
            name = resume.file_name
            if resume.parsed_data:
                name = resume.parsed_data.get("name") or resume.file_name
        else:
            name = "Unknown"
        rows.append({
            "Rank": s.rank,
            "Name": name,
            "Score": round(s.total_score, 1),
            "Skills Score": round(s.skills_score, 1),
            "Experience Score": round(s.experience_score, 1),
            "Education Score": round(s.education_score, 1),
            "Keyword Score": round(s.keyword_score, 1),
            "Matching Skills": ", ".join(s.matching_skills or []),
            "Missing Skills": ", ".join(s.missing_skills or []),
        })

    headers_list = ["Rank", "Name", "Score", "Skills Score", "Experience Score", "Education Score", "Keyword Score", "Matching Skills", "Missing Skills"]

    if format == "xlsx":
        from openpyxl import Workbook
        wb = Workbook()
        ws = wb.active
        ws.title = "Results"
        ws.append(headers_list)
        for r in rows:
            ws.append([r[h] for h in headers_list])
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=results_{job_id}.xlsx"},
        )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers_list)
    for r in rows:
        writer.writerow([r[h] for h in headers_list])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=results_{job_id}.csv"},
    )
