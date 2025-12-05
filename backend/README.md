# BobberVox Backend

Video dubbing workflow API with AI-powered transcription and TTS.

## Development

```bash
# Create virtual environment
python3.11 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -e ".[dev]"

# Run development server
uvicorn app.main:app --reload

# Run tests
pytest
```

## API Documentation

Once running, visit http://localhost:8000/docs for OpenAPI documentation.
