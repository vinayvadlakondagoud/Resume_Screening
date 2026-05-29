import os
import uuid
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Resume, Job
from app.schemas.schemas import UploadResponse
from app.config import UPLOAD_DIR, ALLOWED_EXTENSIONS, MAX_FILE_SIZE, MAX_FILES_PER_BATCH
from app.services.parser import extract_text

router = APIRouter(prefix="/api/upload", tags=["upload"])


@router.post("/resumes", response_model=UploadResponse)
async def upload_resumes(
    job_id: str = Form(...),
    files: list[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
):
    job_uuid = uuid.UUID(job_id)
    result = await db.execute(select(Job).where(Job.id == job_uuid))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Job not found")

    if len(files) > MAX_FILES_PER_BATCH:
        raise HTTPException(status_code=400, detail=f"Max {MAX_FILES_PER_BATCH} files per batch")

    resume_ids = []
    for file in files:
        ext = os.path.splitext(file.filename or "resume.pdf")[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            continue

        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            continue

        file_id = uuid.uuid4()
        safe_name = f"{file_id}{ext}"
        file_path = os.path.join(UPLOAD_DIR, safe_name)
        with open(file_path, "wb") as f:
            f.write(content)

        raw_text = extract_text(file_path)

        resume = Resume(
            id=file_id,
            job_id=job_uuid,
            file_name=file.filename or "unknown",
            file_path=file_path,
            raw_text=raw_text,
        )
        db.add(resume)
        resume_ids.append(file_id)

    await db.commit()
    return UploadResponse(uploaded=len(resume_ids), resume_ids=resume_ids)
