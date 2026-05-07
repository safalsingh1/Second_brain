import os
import json
import uuid
import numpy as np
import faiss
from datetime import datetime
from sentence_transformers import SentenceTransformer
from typing import List, Tuple, Optional
from app.config import (
    EMBED_MODEL, FAISS_INDEX_PATH, METADATA_PATH,
    MAX_CHUNK_SIZE, CHUNK_OVERLAP
)
from app.models import MemoryChunk


class VectorMemory:
    """FAISS-backed vector store for project memory."""

    def __init__(self):
        self.model = SentenceTransformer(EMBED_MODEL)
        self.dimension = 384  # all-MiniLM-L6-v2 output dim
        self.index: Optional[faiss.IndexFlatIP] = None
        self.chunks: List[MemoryChunk] = []
        self._load()

    def _load(self):
        os.makedirs(os.path.dirname(FAISS_INDEX_PATH), exist_ok=True)
        if os.path.exists(FAISS_INDEX_PATH) and os.path.exists(METADATA_PATH):
            self.index = faiss.read_index(FAISS_INDEX_PATH)
            with open(METADATA_PATH, "r", encoding="utf-8") as f:
                raw = json.load(f)
            self.chunks = [MemoryChunk(**c) for c in raw]
        else:
            self.index = faiss.IndexFlatIP(self.dimension)
            self.chunks = []

    def _save(self):
        faiss.write_index(self.index, FAISS_INDEX_PATH)
        with open(METADATA_PATH, "w", encoding="utf-8") as f:
            json.dump([c.model_dump() for c in self.chunks], f, indent=2, ensure_ascii=False)

    def _chunk_text(self, text: str) -> List[str]:
        words = text.split()
        chunks = []
        start = 0
        while start < len(words):
            end = min(start + MAX_CHUNK_SIZE, len(words))
            chunks.append(" ".join(words[start:end]))
            start += MAX_CHUNK_SIZE - CHUNK_OVERLAP
        return chunks if chunks else [text]

    def add_document(self, file_name: str, file_type: str, content: str, summary: Optional[str] = None):
        """Chunk, embed, and store a document."""
        chunks = self._chunk_text(content)
        texts = [c for c in chunks if c.strip()]
        if not texts:
            return

        embeddings = self.model.encode(texts, normalize_embeddings=True)
        self.index.add(np.array(embeddings, dtype=np.float32))

        timestamp = datetime.utcnow().isoformat()
        for i, (chunk_text, _) in enumerate(zip(texts, embeddings)):
            chunk = MemoryChunk(
                id=str(uuid.uuid4()),
                file_name=file_name,
                file_type=file_type,
                chunk_index=i,
                content=chunk_text,
                timestamp=timestamp,
                summary=summary if i == 0 else None,
            )
            self.chunks.append(chunk)

        self._save()
        return len(texts)

    def search(self, query: str, top_k: int = 5) -> List[Tuple[MemoryChunk, float]]:
        """Semantic search over all stored chunks."""
        if self.index.ntotal == 0:
            return []
        query_vec = self.model.encode([query], normalize_embeddings=True)
        scores, indices = self.index.search(np.array(query_vec, dtype=np.float32), min(top_k, self.index.ntotal))
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < len(self.chunks):
                results.append((self.chunks[idx], float(score)))
        return results

    def delete_file(self, file_name: str):
        """Remove all chunks belonging to a specific file (requires full rebuild)."""
        remaining = [c for c in self.chunks if c.file_name != file_name]
        if len(remaining) == len(self.chunks):
            return  # nothing to delete

        self.chunks = remaining
        self.index = faiss.IndexFlatIP(self.dimension)
        if remaining:
            texts = [c.content for c in remaining]
            embeddings = self.model.encode(texts, normalize_embeddings=True)
            self.index.add(np.array(embeddings, dtype=np.float32))
        self._save()

    def get_all_files(self) -> List[dict]:
        """Get unique files with metadata."""
        seen = {}
        for chunk in self.chunks:
            if chunk.file_name not in seen:
                seen[chunk.file_name] = {
                    "file_name": chunk.file_name,
                    "file_type": chunk.file_type,
                    "timestamp": chunk.timestamp,
                    "summary": chunk.summary,
                    "chunk_count": 0,
                }
            seen[chunk.file_name]["chunk_count"] += 1
        return sorted(seen.values(), key=lambda x: x["timestamp"], reverse=True)

    def get_stats(self) -> dict:
        files = self.get_all_files()
        type_counts: dict = {}
        for f in files:
            ft = f["file_type"]
            type_counts[ft] = type_counts.get(ft, 0) + 1
        last_updated = max((f["timestamp"] for f in files), default=None)
        return {
            "total_files": len(files),
            "total_chunks": len(self.chunks),
            "file_types": type_counts,
            "last_updated": last_updated,
        }


# Singleton
_memory: Optional[VectorMemory] = None


def get_memory() -> VectorMemory:
    global _memory
    if _memory is None:
        _memory = VectorMemory()
    return _memory
