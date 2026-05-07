import os
import shutil
from typing import List
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import UPLOAD_DIR
from app.models import QueryRequest, QueryResponse, TodoItem, ProjectStats
from app.memory import get_memory
from app.parser import extract_text
from app.agent import (
    answer_question,
    generate_todos,
    detect_inconsistencies,
    summarize_document,
    summarize_progress,
)

app = FastAPI(title="Second Brain API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.get("/health")
def health():
    return {"status": "ok", "message": "Second Brain is alive"}


@app.post("/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    """Ingest one or more files into project memory."""
    memory = get_memory()
    results = []

    for file in files:
        try:
            file_bytes = await file.read()
            content, file_type = extract_text(file_bytes, file.filename)

            if not content.strip():
                results.append({
                    "file_name": file.filename,
                    "status": "skipped",
                    "reason": "No extractable text content",
                })
                continue

            # Generate summary via AI
            summary = summarize_document(file.filename, content, file_type)

            # Add to vector memory
            chunk_count = memory.add_document(
                file_name=file.filename,
                file_type=file_type,
                content=content,
                summary=summary,
            )

            # Save raw file
            save_path = os.path.join(UPLOAD_DIR, file.filename)
            with open(save_path, "wb") as f:
                f.write(file_bytes)

            results.append({
                "file_name": file.filename,
                "file_type": file_type,
                "chunk_count": chunk_count,
                "summary": summary,
                "status": "success",
            })

        except Exception as e:
            results.append({
                "file_name": file.filename,
                "status": "error",
                "reason": str(e),
            })

    return {"results": results}


@app.post("/query", response_model=QueryResponse)
def query_memory(request: QueryRequest):
    """Answer a question using project memory (RAG)."""
    memory = get_memory()
    return answer_question(request.question, memory, top_k=request.top_k)


@app.get("/todos")
def get_todos():
    """Auto-generate TODO items from project memory."""
    memory = get_memory()
    todos = generate_todos(memory)
    return {"todos": [t.model_dump() for t in todos]}


@app.get("/timeline")
def get_timeline():
    """Return chronological list of ingested files."""
    memory = get_memory()
    files = memory.get_all_files()
    return {"timeline": files}


@app.get("/stats", response_model=ProjectStats)
def get_stats():
    """Return project memory statistics."""
    memory = get_memory()
    return memory.get_stats()


@app.get("/inconsistencies")
def get_inconsistencies():
    """Detect inconsistencies across project files."""
    memory = get_memory()
    report = detect_inconsistencies(memory)
    return {"report": report}


@app.get("/progress")
def get_progress():
    """Generate a project progress summary."""
    memory = get_memory()
    summary = summarize_progress(memory)
    return {"summary": summary}


@app.delete("/file/{file_name:path}")
def delete_file(file_name: str):
    """Remove a file from project memory."""
    memory = get_memory()
    memory.delete_file(file_name)
    raw_path = os.path.join(UPLOAD_DIR, file_name)
    if os.path.exists(raw_path):
        os.remove(raw_path)
    return {"message": f"Deleted {file_name}"}


@app.delete("/reset")
def reset_memory():
    """Wipe all project memory."""
    memory = get_memory()
    memory.chunks = []
    import faiss
    memory.index = faiss.IndexFlatIP(384)
    memory._save()
    if os.path.exists(UPLOAD_DIR):
        shutil.rmtree(UPLOAD_DIR)
        os.makedirs(UPLOAD_DIR, exist_ok=True)
    return {"message": "Memory reset complete"}
