import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = "llama-3.3-70b-versatile"
EMBED_MODEL = "all-MiniLM-L6-v2"
FAISS_INDEX_PATH = "data/faiss.index"
METADATA_PATH = "data/metadata.json"
UPLOAD_DIR = "data/uploads"
MAX_CHUNK_SIZE = 800
CHUNK_OVERLAP = 100
