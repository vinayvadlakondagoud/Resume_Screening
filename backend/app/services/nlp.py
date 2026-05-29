import re

SKILL_KEYWORDS = [
    "python", "java", "javascript", "typescript", "c++", "c#", "ruby", "go", "rust", "swift",
    "kotlin", "php", "scala", "perl", "r", "matlab", "sql", "nosql", "mongodb", "postgresql",
    "mysql", "redis", "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "jenkins",
    "git", "linux", "unix", "react", "angular", "vue", "node", "django", "flask", "fastapi",
    "spring", "express", "rails", "laravel", "tensorflow", "pytorch", "pandas", "numpy",
    "scikit-learn", "spark", "hadoop", "kafka", "rabbitmq", "nginx", "agile", "scrum",
    "rest", "graphql", "grpc", "oauth", "jwt", "html", "css", "sass", "less", "webpack",
    "babel", "jest", "mocha", "cypress", "selenium", "tableau", "power bi", "excel",
    "machine learning", "deep learning", "nlp", "computer vision", "data science",
    "data engineering", "devops", "ci/cd", "microservices", "api", "restful",
    "saas", "paas", "iaas", "serverless", "lambda", "ec2", "s3", "cloudformation",
]

EDUCATION_KEYWORDS = {
    "phd": "phd",
    "ph.d": "phd",
    "doctorate": "phd",
    "master": "master",
    "msc": "master",
    "m.s": "master",
    "mba": "master",
    "bachelor": "bachelor",
    "b.s": "bachelor",
    "bsc": "bachelor",
    "b.tech": "bachelor",
    "associate": "associate",
}

EDUCATION_LEVELS = {"phd": 4, "master": 3, "bachelor": 2, "associate": 1, "other": 0}


def extract_skills_from_text(text: str) -> list[str]:
    text_lower = text.lower()
    found = set()
    for skill in SKILL_KEYWORDS:
        if skill in text_lower:
            found.add(skill)
    return sorted(found)


def extract_years_experience(text: str) -> float:
    patterns = [
        r"(\d+)\+?\s*years?\s*(?:of\s+)?experience",
        r"experience\s*(?:of\s+)?(\d+)\+?\s*years?",
        r"(\d+)\+?\s*yrs?\s*(?:of\s+)?experience",
        r"experience\s*(?:of\s+)?(\d+)\+?\s*yrs?",
    ]
    years = []
    for pat in patterns:
        matches = re.findall(pat, text.lower())
        years.extend(int(m) for m in matches)
    return float(max(years)) if years else 0.0


def extract_education(text: str) -> dict:
    text_lower = text.lower()
    degree = "other"
    field = ""

    for kw, val in EDUCATION_KEYWORDS.items():
        if kw in text_lower:
            degree = val
            break

    field_patterns = [
        r"(?:computer|software|information|data|electrical|mechanical|civil|chemical|biomedical)\s*(?:science|engineering|technology|systems)?",
        r"(?:business|finance|marketing|economics|accounting|management)",
        r"(?:mathematics|physics|chemistry|biology|statistics)",
    ]
    for pat in field_patterns:
        m = re.search(pat, text_lower)
        if m:
            field = m.group(0).strip()
            break

    return {"degree": degree, "level": EDUCATION_LEVELS.get(degree, 0), "field": field}


def extract_email(text: str) -> str:
    m = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)
    return m.group(0) if m else ""


def extract_phone(text: str) -> str:
    m = re.search(r"[\+]?[\d\s\-\(\)]{7,20}", text)
    return m.group(0).strip() if m else ""


def extract_name(text: str) -> str:
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    if not lines:
        return ""
    for line in lines[:5]:
        clean = re.sub(r"[^A-Za-z\s\'\-\.]", "", line).strip()
        if re.match(r"^[A-Z][a-zA-Z]+([\'\-\s][A-Z][a-zA-Z]+){1,3}$", clean) and len(clean) > 2:
            return clean
    return ""


def parse_resume_data(text: str) -> dict:
    return {
        "name": extract_name(text),
        "email": extract_email(text),
        "phone": extract_phone(text),
        "skills": extract_skills_from_text(text),
        "experience_years": extract_years_experience(text),
        "education": extract_education(text),
    }
