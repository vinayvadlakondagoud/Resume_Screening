import os


DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./resume_screening.db")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
MAX_FILE_SIZE = 5 * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx"}
MAX_FILES_PER_BATCH = 50
