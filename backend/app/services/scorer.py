import uuid
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Job, Resume, Score
from app.services.nlp import extract_skills_from_text, EDUCATION_LEVELS


def compute_and_store_scores(session: AsyncSession, job: Job, resume: Resume):
    jd_skills = job.extracted_skills or extract_skills_from_text(job.description)
    resume_data = resume.parsed_data or {}
    resume_skills = resume_data.get("skills", [])
    resume_text = resume.raw_text or ""

    set_jd = set(s.lower() for s in jd_skills)
    set_resume = set(s.lower() for s in resume_skills)

    matching = list(set_jd & set_resume)
    missing = list(set_jd - set_resume)

    skills_score = (len(matching) / len(set_jd) * 100) if set_jd else 0

    jd_exp = _extract_jd_experience(job.description)
    resume_exp = resume_data.get("experience_years", 0)
    if jd_exp > 0:
        exp_ratio = min(resume_exp / jd_exp, 2.0)
        experience_score = min(exp_ratio * 50, 100)
    else:
        experience_score = 50

    jd_edu = _extract_jd_education(job.description)
    resume_edu_level = resume_data.get("education", {}).get("level", 0)
    edu_levels = {"phd": 4, "master": 3, "bachelor": 2, "associate": 1}
    jd_edu_level = edu_levels.get(jd_edu, 0)
    if jd_edu_level > 0 and resume_edu_level >= jd_edu_level:
        education_score = 100
    elif jd_edu_level > 0:
        education_score = (resume_edu_level / jd_edu_level) * 100
    else:
        education_score = 50

    try:
        vectorizer = TfidfVectorizer(stop_words="english")
        tfidf_matrix = vectorizer.fit_transform([job.description, resume_text])
        keyword_score = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0] * 100
    except Exception:
        keyword_score = 0

    total_score = (
        skills_score * 0.40
        + experience_score * 0.25
        + education_score * 0.15
        + keyword_score * 0.20
    )

    score = Score(
        id=uuid.uuid4(),
        resume_id=resume.id,
        job_id=job.id,
        total_score=total_score,
        skills_score=skills_score,
        experience_score=experience_score,
        education_score=education_score,
        keyword_score=keyword_score,
        matching_skills=matching,
        missing_skills=missing,
    )
    session.add(score)


def _extract_jd_experience(jd_text: str) -> float:
    import re
    patterns = [
        r"(\d+)\+?\s*years?\s*(?:of\s+)?experience",
        r"experience\s*(?:of\s+)?(\d+)\+?\s*years?",
    ]
    for pat in patterns:
        m = re.search(pat, jd_text.lower())
        if m:
            return float(m.group(1))
    return 0.0


def _extract_jd_education(jd_text: str) -> str:
    jd_lower = jd_text.lower()
    if any(kw in jd_lower for kw in ["phd", "ph.d", "doctorate"]):
        return "phd"
    if any(kw in jd_lower for kw in ["master", "msc", "m.s", "mba"]):
        return "master"
    if any(kw in jd_lower for kw in ["bachelor", "b.s", "bsc", "b.tech"]):
        return "bachelor"
    return "other"
