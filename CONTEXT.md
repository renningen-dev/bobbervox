# BobberVox Development Context

## What This Is

Video dubbing workflow app: upload video → extract audio → select segments via waveform → AI transcription/translation (gpt-4o-audio-preview) → TTS generation (tts-1-hd).

## Key Documents

- **[DESIGN.md](./DESIGN.md)** - Full product specification
- **[Implementation Plan](/.claude/plans/reflective-bouncing-cray.md)** - Detailed technical plan with all 8 phases

## Current State

**All Phases Complete** - Full application functional with Docker support.

### Working Features

#### Backend (Phases 1-3)
- Project CRUD: `POST/GET/DELETE /api/projects`
- Video upload: `POST /api/projects/{id}/upload`
- Audio extraction: `POST /api/projects/{id}/extract-audio`
- Segment CRUD: `POST/GET/DELETE /api/projects/{id}/segments`
- Segment audio extraction: `POST /api/segments/{id}/extract`
- AI analysis: `POST /api/segments/{id}/analyze` (gpt-4o-audio-preview)
- TTS generation: `POST /api/segments/{id}/generate-tts` (tts-1-hd)
- File serving: `GET /api/files/{project_id}/{audio|segments|output}/{filename}`
- Translation/analysis updates: `PUT /api/segments/{id}/{translation|analysis}`
- SQLite + async SQLAlchemy with Alembic migrations
- Tests passing (47 tests), pre-commit hooks configured

#### Frontend (Phases 4-7)
- Vite + React 19 + TypeScript
- Tailwind CSS v4 with @tailwindcss/postcss
- TanStack Query for server state
- Zustand for client state (editorStore)
- React Router DOM for routing
- Headless UI for accessible dialogs
- React Hook Form + Zod for form validation
- React Dropzone for video uploads
- Vitest + MSW for testing (5 tests passing)
- Project list/create/delete UI
- Video upload dropzone
- Audio extraction trigger
- WaveSurfer.js waveform player with region selection
- Segment creation from waveform regions (auto-extracts audio)
- Waveform region highlighting on segment card hover
- Segment visibility toggle (eye icon)
- SegmentCard with expandable details
- AI analysis display with editable fields (auto-save)
- Translation editor with save
- TTS voice selector and generation
- Audio players for segments and TTS results
- Download TTS audio (individual + zip all)

#### Docker (Phase 8)
- Backend Dockerfile with Python 3.11 + FFmpeg + libmagic
- Frontend multi-stage Dockerfile (Node build → nginx serve)
- docker-compose.yml for full stack deployment
- nginx proxy configuration for API routing
- Environment-aware API client (relative URLs in Docker)

## Key Technical Decisions

### Backend Stack

- **Python 3.9** (not 3.11 - system constraint)
- **FastAPI** with async everywhere
- **SQLAlchemy 2.0** async pattern with aiosqlite
- **ffmpeg-python** for audio processing (not PyAV)
- **Pydantic v2** for schemas

### Patterns Established

```
backend/
├── app/
│   ├── models/          # SQLAlchemy ORM
│   ├── schemas/         # Pydantic request/response
│   ├── repositories/    # Data access layer
│   ├── services/        # Business logic
│   ├── routers/         # FastAPI endpoints
│   └── utils/           # Exceptions, helpers
```

### Dependency Injection

Services receive dependencies via FastAPI's `Depends()`:

- `get_async_session` → repositories
- `get_settings` → services needing config
- Settings override in tests via `app.dependency_overrides`

### Python 3.9 Compatibility

Use `Optional[X]` not `X | None` - ruff configured to ignore UP007/UP045.

## Dev Workflow

```bash
# Backend
cd backend
make test      # Run tests
make format    # Ruff lint + format
make run       # uvicorn dev server
make migrate   # Apply migrations

# Frontend
cd frontend
make dev       # Vite dev server
make build     # Production build
make test-run  # Run tests once
make lint      # ESLint
```

## User Preferences

- **No Claude footer** in commits
- **No "feat:" prefix** in commit messages
- **Simple commands** - use Makefile, avoid absolute paths
- **Commit each step** with pre-commit hooks

## Critical Files

| File                        | Purpose                         |
|-----------------------------|---------------------------------|
| `DESIGN.md`                 | Full specification              |
| `backend/app/main.py`       | FastAPI app factory             |
| `backend/app/database.py`   | Async engine + session          |
| `backend/app/config.py`     | Pydantic Settings               |
| `backend/tests/conftest.py` | Test fixtures with DI overrides |

## Gotchas Discovered

1. **Async SQLAlchemy refresh**: After `update()`, must call `session.refresh(obj)` or Pydantic validation fails with
   greenlet error.

2. **Test settings injection**: Can't monkeypatch Pydantic Settings. Override `get_settings` dependency instead.

3. **Alembic async**: Requires custom `env.py` with `async_engine_from_config` and `asyncio.run()`.

4. **File uploads**: Use `file.file` (SpooledTemporaryFile) not `file` directly.

## Docker Deployment

```bash
# Copy and configure environment
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Build and run
docker compose up --build

# Access the app at http://localhost
# API available at http://localhost/api
```

## API Design Reference

Segment status flow:

```
created → extracting → extracted → analyzing → analyzed → generating_tts → completed
                                                                        ↘ error
```

Timestamp filename format: `segment_{MM}m{SS}s{mmm}ms.wav`
Example: 15.32 seconds → `segment_00m15s320ms.wav`
