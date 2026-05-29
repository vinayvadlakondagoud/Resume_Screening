import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import upload, jobs, screening, files
from app.database import engine
from app.models.db_models import Base
from app.config import UPLOAD_DIR

app = FastAPI(title="Resume Screening API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(jobs.router)
app.include_router(screening.router)
app.include_router(files.router)


@app.on_event("startup")
async def startup():
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.get("/health")
async def health():
    return {"status": "ok"}
