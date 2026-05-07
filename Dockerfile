FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (needed for FAISS and some parsing libraries)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend directory
COPY backend/ .

# Expose port (Railway provides $PORT dynamically, but exposing 8000 is good practice)
EXPOSE 8000

# Start the FastAPI server using the PORT environment variable provided by Railway
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
