import os


_raw_db_url = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./resume_screening.db")
if _raw_db_url.startswith("postgresql://") and "asyncpg" not in _raw_db_url:
    _raw_db_url = _raw_db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
DATABASE_URL = _raw_db_url
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
MAX_FILE_SIZE = 5 * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx"}
MAX_FILES_PER_BATCH = 50
