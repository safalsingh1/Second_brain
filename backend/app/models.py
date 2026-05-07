from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class MemoryChunk(BaseModel):
    id: str
    file_name: str
    file_type: str
    chunk_index: int
    content: str
    timestamp: str
    summary: Optional[str] = None


class QueryRequest(BaseModel):
    question: str
    top_k: int = 5


class QueryResponse(BaseModel):
    answer: str
    sources: List[str]
    confidence: str


class TodoItem(BaseModel):
    id: str
    title: str
    description: str
    priority: str  # high / medium / low
    category: str
    created_at: str


class TimelineEntry(BaseModel):
    id: str
    file_name: str
    file_type: str
    timestamp: str
    summary: str
    chunk_count: int


class ProjectStats(BaseModel):
    total_files: int
    total_chunks: int
    file_types: dict
    last_updated: Optional[str]
