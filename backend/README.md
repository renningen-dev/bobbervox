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
- `VOICES_DIR` - Directory for custom voice files
- `FIREBASE_PROJECT_ID` - Firebase project ID
- `CHATTERBOX_BASE_URL` - ChatterBox TTS server URL (default: `http://localhost:8004`)
- `TAILSCALE_AUTHKEY` - Tailscale auth key for Docker deployment

## Docker Deployment

### Basic deployment (without Tailscale)
```bash
docker-compose up -d
```

### With Tailscale (for connecting to local ChatterBox)
```bash
docker-compose --profile tailscale up -d
```

### Managing Tailscale independently
```bash
# Start Tailscale later
docker-compose --profile tailscale up -d tailscale

# Stop Tailscale (backend keeps running)
docker-compose stop tailscale

# Restart Tailscale
docker-compose --profile tailscale restart tailscale
```

### Tailscale Setup

1. Get your local machine's Tailscale IP:
   ```bash
   tailscale ip -4
   # Example: 100.64.0.15
   ```

2. Create a Tailscale auth key at https://login.tailscale.com/admin/settings/keys

3. Add to your `.env`:
   ```env
   TAILSCALE_AUTHKEY=tskey-auth-xxxxxxxxxxxxx
   CHATTERBOX_BASE_URL=http://100.64.0.15:8004
   ```

4. Start ChatterBox on your local machine (listening on all interfaces):
   ```bash
   python server.py --host 0.0.0.0 --port 8004
   ```
