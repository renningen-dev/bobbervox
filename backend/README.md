# BobberVox Backend

FastAPI backend for the BobberVox video dubbing application.

## Features

- Video upload and audio extraction using FFmpeg
- AI-powered transcription and translation using OpenAI GPT-4o Audio
- Text-to-speech generation with customizable voice parameters
- Project and segment management
- Firebase authentication

## Requirements

- Python 3.9+
- FFmpeg
- OpenAI API key

## Development

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -e ".[dev]"

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

## Environment Variables

- `DATABASE_URL` - SQLite database URL
- `OPENAI_API_KEY` - OpenAI API key
- `PROJECTS_DIR` - Directory for project files
- `FIREBASE_PROJECT_ID` - Firebase project ID
