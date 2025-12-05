# BobberVox

AI-powered video dubbing application. Upload a video, select segments, and generate professional dubbed audio using
OpenAI's GPT-4o and TTS.

## Features

- Video upload with automatic audio extraction
- Waveform visualization for precise segment selection
- AI-powered transcription and translation (GPT-4o Audio)
- Customizable voice parameters (tone, emotion, style, pace)
- High-quality text-to-speech generation (TTS-1-HD)
- Multi-language support (50+ languages)
- Firebase authentication (Google & GitHub)

## Tech Stack

**Backend:** FastAPI, SQLAlchemy (async), SQLite, FFmpeg, OpenAI API

**Frontend:** React, TypeScript, Tailwind CSS, TanStack Query, Zustand, WaveSurfer.js

## Quick Start (Development)

### Prerequisites

- Python 3.11+
- Node.js 20+
- FFmpeg
- OpenAI API key
- Firebase project (for authentication)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env  # Configure Firebase credentials
npm run dev
```

## Docker Deployment

### Prerequisites

- Docker & Docker Compose
- Domain name (for production)
- Firebase project credentials
- OpenAI API key

### 1. Clone and configure

```bash
git clone <repo-url> bobbervox
cd bobbervox
```

### 2. Create `.env` file

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Firebase (from Firebase Console → Project Settings)
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=yourproject.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=yourproject
VITE_FIREBASE_STORAGE_BUCKET=yourproject.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 3. Build and run

```bash
docker compose build
docker compose up -d
```

App will be available at `http://localhost` (frontend) and `http://localhost:8000` (API).

### Production Deployment (VPS)

For production with a custom domain:

1. **Update CORS** in `docker-compose.yml`:
   ```yaml
   CORS_ORIGINS=["https://yourdomain.com"]
   ```

2. **Add domain to Firebase**:
    - Firebase Console → Authentication → Settings → Authorized domains
    - Add your domain

3. **Setup HTTPS** (choose one):
    - **Cloudflare**: Point domain to VPS, enable SSL in Cloudflare dashboard
    - **Let's Encrypt**: Use Traefik or Certbot with nginx

4. **Deploy**:
   ```bash
   docker compose build --no-cache
   docker compose up -d
   ```

## Project Structure

```
bobbervox/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI application
│   │   ├── models/           # SQLAlchemy models
│   │   ├── routers/          # API endpoints
│   │   ├── services/         # Business logic
│   │   └── repositories/     # Data access
│   ├── alembic/              # Database migrations
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── features/         # API hooks
│   │   ├── pages/            # Route pages
│   │   └── stores/           # Zustand stores
│   └── Dockerfile
└── docker-compose.yml
```

## API Documentation

When running, visit `http://localhost:8000/docs` for interactive OpenAPI documentation.

## Environment Variables

| Variable                            | Description                    | Required |
|-------------------------------------|--------------------------------|----------|
| `OPENAI_API_KEY`                    | OpenAI API key                 | Yes      |
| `VITE_FIREBASE_API_KEY`             | Firebase API key               | Yes      |
| `VITE_FIREBASE_AUTH_DOMAIN`         | Firebase auth domain           | Yes      |
| `VITE_FIREBASE_PROJECT_ID`          | Firebase project ID            | Yes      |
| `VITE_FIREBASE_STORAGE_BUCKET`      | Firebase storage bucket        | Yes      |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID             | Yes      |
| `VITE_FIREBASE_APP_ID`              | Firebase app ID                | Yes      |
| `DATABASE_URL`                      | Database URL (default: SQLite) | No       |
| `PROJECTS_DIR`                      | Project files directory        | No       |

## License

MIT
