import json
import uuid
from datetime import datetime, timezone
from typing import List
from groq import Groq
from app.config import GROQ_API_KEY, GROQ_MODEL
from app.memory import VectorMemory
from app.models import TodoItem, QueryResponse

client = Groq(api_key=GROQ_API_KEY)


def _call_groq(messages: list, temperature: float = 0.3, max_tokens: int = 2048) -> str:
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content.strip()


def summarize_document(file_name: str, content: str, file_type: str) -> str:
    """Generate a short summary for a newly ingested file."""
    snippet = content[:3000]
    messages = [
        {
            "role": "system",
            "content": (
                "You are an expert technical cofounder reviewing project artifacts. "
                "Write a concise 2-3 sentence summary of what this file contains, "
                "its purpose in the project, and any key insights. Be specific and technical."
            ),
        },
        {
            "role": "user",
            "content": f"File: {file_name} (type: {file_type})\n\nContent:\n{snippet}",
        },
    ]
    try:
        return _call_groq(messages, temperature=0.2, max_tokens=300)
    except Exception as e:
        return f"Summary unavailable: {str(e)}"


def answer_question(question: str, memory: VectorMemory, top_k: int = 6) -> QueryResponse:
    """RAG: retrieve context + answer via Groq."""
    results = memory.search(question, top_k=top_k)

    if not results:
        return QueryResponse(
            answer="No relevant information found in your project memory. Try uploading some files first.",
            sources=[],
            confidence="low",
        )

    context_parts = []
    sources = []
    for chunk, score in results:
        context_parts.append(
            f"[Source: {chunk.file_name} | Relevance: {score:.2f}]\n{chunk.content}"
        )
        if chunk.file_name not in sources:
            sources.append(chunk.file_name)

    context = "\n\n---\n\n".join(context_parts)
    avg_score = sum(s for _, s in results) / len(results)
    confidence = "high" if avg_score > 0.6 else "medium" if avg_score > 0.35 else "low"

    messages = [
        {
            "role": "system",
            "content": (
                "You are an intelligent technical cofounder with deep knowledge of this project. "
                "Answer questions using ONLY the provided project context. "
                "Be specific, technical, and actionable. If the context doesn't contain enough info, say so honestly. "
                "Format your answer with markdown when helpful (bullet points, code blocks, etc.)."
            ),
        },
        {
            "role": "user",
            "content": f"Project Context:\n\n{context}\n\n---\n\nQuestion: {question}",
        },
    ]

    try:
        answer = _call_groq(messages, temperature=0.3, max_tokens=1500)
    except Exception as e:
        answer = f"Error generating answer: {str(e)}"

    return QueryResponse(answer=answer, sources=sources, confidence=confidence)


def generate_todos(memory: VectorMemory) -> List[TodoItem]:
    """Analyze project memory and generate actionable TODO items."""
    all_files = memory.get_all_files()
    if not all_files:
        return []

    # Build a project overview from summaries
    summaries = []
    for f in all_files[:20]:
        if f.get("summary"):
            summaries.append(f"- {f['file_name']} ({f['file_type']}): {f['summary']}")
        else:
            summaries.append(f"- {f['file_name']} ({f['file_type']})")

    # Also pull some recent chunks for context
    recent_chunks = memory.chunks[-30:]
    chunk_snippets = "\n\n".join(
        f"[{c.file_name}]: {c.content[:400]}" for c in recent_chunks
    )

    overview = "\n".join(summaries)

    messages = [
        {
            "role": "system",
            "content": (
                "You are a senior technical cofounder reviewing a project. "
                "Analyze the project files and generate 6-10 specific, actionable TODO items. "
                "Each TODO should be concrete and achievable. "
                "Detect gaps, missing pieces, inconsistencies, and next logical steps.\n\n"
                "Respond ONLY with a JSON array of objects with keys:\n"
                "  title (string), description (string), priority (high/medium/low), category (string)\n"
                "Categories can be: Engineering, Documentation, Testing, Design, Architecture, DevOps, Research\n"
                "Return ONLY valid JSON, no prose."
            ),
        },
        {
            "role": "user",
            "content": (
                f"Project Files:\n{overview}\n\n"
                f"Recent Content Samples:\n{chunk_snippets[:4000]}"
            ),
        },
    ]

    try:
        raw = _call_groq(messages, temperature=0.4, max_tokens=2000)
        # Strip markdown fences if present
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip().rstrip("```").strip()

        items = json.loads(raw)
        todos = []
        now = datetime.now(timezone.utc).isoformat()
        for item in items:
            todos.append(
                TodoItem(
                    id=str(uuid.uuid4()),
                    title=item.get("title", "Untitled"),
                    description=item.get("description", ""),
                    priority=item.get("priority", "medium"),
                    category=item.get("category", "Engineering"),
                    created_at=now,
                )
            )
        return todos
    except Exception as e:
        return []


def detect_inconsistencies(memory: VectorMemory) -> str:
    """Scan project memory for contradictions or inconsistencies."""
    if not memory.chunks:
        return "No files in memory to analyze."

    # Sample from different files
    file_samples: dict = {}
    for chunk in memory.chunks:
        if chunk.file_name not in file_samples:
            file_samples[chunk.file_name] = chunk.content[:600]

    samples_text = "\n\n---\n\n".join(
        f"[{fname}]:\n{content}" for fname, content in list(file_samples.items())[:15]
    )

    messages = [
        {
            "role": "system",
            "content": (
                "You are a meticulous technical reviewer. Analyze these project artifacts "
                "and identify: (1) contradictions between files, (2) inconsistent naming or architecture, "
                "(3) missing critical components, (4) outdated references. "
                "Format as a structured markdown report with sections."
            ),
        },
        {
            "role": "user",
            "content": f"Project artifacts to analyze:\n\n{samples_text}",
        },
    ]

    try:
        return _call_groq(messages, temperature=0.2, max_tokens=1500)
    except Exception as e:
        return f"Analysis failed: {str(e)}"


def summarize_progress(memory: VectorMemory) -> str:
    """Generate a progress summary of the entire project."""
    files = memory.get_all_files()
    if not files:
        return "No project files uploaded yet."

    file_list = "\n".join(
        f"- {f['file_name']} ({f['file_type']}, {f['chunk_count']} chunks) — {f.get('summary', 'no summary')}"
        for f in files[:25]
    )

    messages = [
        {
            "role": "system",
            "content": (
                "You are a technical project manager and cofounder. "
                "Based on the project files, write a concise progress summary covering:\n"
                "1. What has been built so far\n"
                "2. Current state of the project\n"
                "3. Key strengths\n"
                "4. Critical gaps\n"
                "5. Recommended next milestone\n"
                "Use markdown formatting."
            ),
        },
        {
            "role": "user",
            "content": f"Project files:\n{file_list}",
        },
    ]

    try:
        return _call_groq(messages, temperature=0.3, max_tokens=1200)
    except Exception as e:
        return f"Summary failed: {str(e)}"
