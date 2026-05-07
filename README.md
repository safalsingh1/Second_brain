# 🧠 Second Brain for Builders

> An AI agent that watches your messy project folder and behaves like an intelligent technical cofounder.

## What It Does

Drop in any project files and the system:
- **Builds a project memory graph** using FAISS vector embeddings
- **Answers questions** about your own project (RAG with Groq LLaMA 3.3)
- **Auto-generates TODOs** by analyzing what's built vs. what's missing
- **Detects inconsistencies** across files (naming, architecture, contradictions)
- **Summarizes progress** and suggests next milestones
- **Timeline memory** of all ingested files

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | FastAPI + Uvicorn |
| AI/LLM | Groq API (LLaMA 3.3 70B) |
| Embeddings | SentenceTransformers (all-MiniLM-L6-v2) |
| Vector DB | FAISS (in-memory + disk persistence) |
| Frontend | Next.js 16 + Tailwind CSS |
| File parsing | pypdf, python-docx, Pillow |

## Supported File Types

`.py` `.js` `.ts` `.tsx` `.jsx` `.java` `.go` `.rs` `.cpp` `.c` `.h`  
`.cs` `.rb` `.php` `.sh` `.yml` `.yaml` `.toml` `.json` `.env`  
`.html` `.css` `.scss` `.sql` `.graphql` `.md` `.mdx` `.rst`  
`.txt` `.log` `.csv` `.pdf` `.docx` `.png` `.jpg` `.jpeg` `.gif` `.webp`

## Quick Start

### 1. Backend

```bash
cd backend
# Add your Groq API key
echo "GROQ_API_KEY=your_key_here" > .env

# Install dependencies
python -m pip install -r requirements.txt

# Start the server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload` | Ingest files into memory |
| POST | `/query` | RAG Q&A over project |
| GET | `/todos` | AI-generated TODO list |
| GET | `/timeline` | File ingestion history |
| GET | `/stats` | Memory statistics |
| GET | `/progress` | Project progress summary |
| GET | `/inconsistencies` | Cross-file inconsistency report |
| DELETE | `/file/{name}` | Remove file from memory |
| DELETE | `/reset` | Wipe all memory |

## Project Structure

```
second_brain/
├── backend/
│   ├── app/
│   │   ├── main.py       # FastAPI routes
│   │   ├── agent.py      # Groq AI agent (Q&A, TODOs, analysis)
│   │   ├── memory.py     # FAISS vector store
│   │   ├── parser.py     # Multi-format file parser
│   │   ├── models.py     # Pydantic schemas
│   │   └── config.py     # Constants & env
│   ├── data/             # Persisted FAISS index + uploads
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── app/page.tsx      # Main 3-column layout
    │   ├── components/
    │   │   ├── UploadZone.tsx   # Drag & drop ingestion
    │   │   ├── QueryPanel.tsx   # RAG chat interface
    │   │   ├── TodoPanel.tsx    # AI-generated TODOs
    │   │   ├── Timeline.tsx     # File history
    │   │   └── AnalysisPanel.tsx # Progress + inconsistencies
    │   └── lib/api.ts        # Typed API client
    └── package.json
```
