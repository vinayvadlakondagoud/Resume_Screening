from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Resume
import uuid

router = APIRouter(prefix="/api/files", tags=["files"])


@router.get("/{resume_id}")
async def get_resume_file(resume_id: str, db: AsyncSession = Depends(get_db)):
    try:
        rid = uuid.UUID(resume_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid resume ID")

    result = await db.execute(select(Resume).where(Resume.id == rid))
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    return FileResponse(resume.file_path, filename=resume.file_name, media_type="application/octet-stream")
