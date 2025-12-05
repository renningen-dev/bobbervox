FROM python:3.11-slim

# Install ffmpeg, libmagic, and zip
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libmagic1 \
    zip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY pyproject.toml README.md ./
RUN pip install --no-cache-dir .

# Copy application code
COPY app/ app/
COPY alembic/ alembic/
COPY alembic.ini .

# Create directories for data
RUN mkdir -p /app/projects /app/data

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PROJECTS_DIR=/app/projects
ENV DATABASE_URL=sqlite+aiosqlite:///./data/bobbervox.db

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
