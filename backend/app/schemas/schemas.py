from datetime import datetime
from pydantic import BaseModel
from typing import Optional
from uuid import UUID


class JobCreate(BaseModel):
    title: Optional[str] = None
    description: str


class JobResponse(BaseModel):
    job_id: UUID
    title: Optional[str]
    extracted_skills: list[str]


class UploadResponse(BaseModel):
    uploaded: int
    resume_ids: list[UUID]


class ScreeningStart(BaseModel):
    job_id: UUID


class ScreeningStatus(BaseModel):
    status: str
    task_id: UUID


class CandidateResult(BaseModel):
    rank: int
    candidate_name: str
    score: float
    matching_skills: list[str]
    missing_skills: list[str]
    resume_url: str
    resume_preview: str = ""
    skills_score: float
    experience_score: float
    education_score: float
    keyword_score: float


class CandidateSummary(BaseModel):
    rank: int
    candidate_name: str
    score: float


class JobSummaryResponse(BaseModel):
    job_id: UUID
    title: Optional[str]
    extracted_skills: list[str]
    created_at: Optional[datetime]
    candidate_count: int
    average_score: float
    top_score: float
    top_candidate_name: Optional[str] = None
    top_candidates: list[CandidateSummary] = []


class ResultsResponse(BaseModel):
    job_id: UUID
    job_title: Optional[str]
    candidates: list[CandidateResult]
    total: int
    average_score: float
    top_score: float
