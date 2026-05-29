import os
import re


def extract_text(file_path: str) -> str:
    ext = os.path.splitext(file_path)[1].lower()
    try:
        if ext == ".pdf":
            return _extract_pdf(file_path)
        elif ext == ".docx":
            return _extract_docx(file_path)
        elif ext == ".doc":
            return _extract_old_doc(file_path)
    except Exception:
        return ""
    return ""


def _extract_pdf(file_path: str) -> str:
    from pdfminer.high_level import extract_text as pdf_extract
    return pdf_extract(file_path)


def _extract_docx(file_path: str) -> str:
    from docx import Document
    doc = Document(file_path)
    return "\n".join(p.text for p in doc.paragraphs)


def _extract_old_doc(file_path: str) -> str:
    try:
        import olefile
        ole = olefile.OleFileIO(file_path)
        text_parts = []

        for stream_name in ole.listdir():
            if isinstance(stream_name, list):
                stream_name = "/".join(stream_name)
            if ole.exists(stream_name):
                data = ole.openstream(stream_name).read()
                decoded = data.decode("utf-8", errors="ignore")
                cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", " ", decoded)
                words = re.findall(r"[A-Za-z0-9\s\.\,\;\:\!\?\-\(\)\/]+", cleaned)
                text_parts.extend(w.strip() for w in words if len(w.strip()) > 2)

        ole.close()
        result = " ".join(text_parts)
        return result.strip()
    except Exception:
        return ""
