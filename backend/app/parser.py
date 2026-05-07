import os
import io
import re
from typing import Optional

# PDF
try:
    from pypdf import PdfReader
    HAS_PDF = True
except ImportError:
    HAS_PDF = False

# DOCX
try:
    from docx import Document
    HAS_DOCX = True
except ImportError:
    HAS_DOCX = False

# Images (OCR-less; we extract metadata + filename context)
try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False


def extract_text(file_bytes: bytes, filename: str) -> tuple[str, str]:
    """
    Returns (extracted_text, file_type).
    file_type is one of: code, markdown, text, pdf, docx, image, unknown
    """
    ext = os.path.splitext(filename)[1].lower()

    # ----- Code files -----
    code_exts = {
        ".py", ".js", ".ts", ".tsx", ".jsx", ".java", ".go", ".rs",
        ".cpp", ".c", ".h", ".cs", ".rb", ".php", ".swift", ".kt",
        ".sh", ".bash", ".yml", ".yaml", ".toml", ".json", ".env",
        ".html", ".css", ".scss", ".sql", ".graphql", ".proto",
    }
    if ext in code_exts:
        try:
            return file_bytes.decode("utf-8", errors="replace"), "code"
        except Exception:
            return "", "code"

    # ----- Markdown -----
    if ext in {".md", ".mdx", ".rst"}:
        try:
            return file_bytes.decode("utf-8", errors="replace"), "markdown"
        except Exception:
            return "", "markdown"

    # ----- Plain text -----
    if ext in {".txt", ".log", ".csv"}:
        try:
            return file_bytes.decode("utf-8", errors="replace"), "text"
        except Exception:
            return "", "text"

    # ----- PDF -----
    if ext == ".pdf" and HAS_PDF:
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            pages = []
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    pages.append(text)
            return "\n\n".join(pages), "pdf"
        except Exception:
            return "", "pdf"

    # ----- DOCX -----
    if ext in {".docx", ".doc"} and HAS_DOCX:
        try:
            doc = Document(io.BytesIO(file_bytes))
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            return "\n".join(paragraphs), "docx"
        except Exception:
            return "", "docx"

    # ----- Images -----
    if ext in {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg"}:
        # We can't do OCR without tesseract; store a rich description stub
        name_hint = os.path.splitext(filename)[0].replace("_", " ").replace("-", " ")
        text = (
            f"[IMAGE FILE: {filename}]\n"
            f"Image name hint: {name_hint}\n"
            f"This is a visual artifact uploaded to the project. "
            f"It may be a screenshot, diagram, or UI mockup related to: {name_hint}."
        )
        return text, "image"

    # ----- Fallback: try UTF-8 -----
    try:
        decoded = file_bytes.decode("utf-8", errors="replace")
        return decoded, "text"
    except Exception:
        return f"[Binary file: {filename}]", "unknown"
