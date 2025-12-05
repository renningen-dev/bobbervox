# BobberVox Development Context

## What This Is

Video dubbing workflow app: upload video → extract audio → select segments via waveform → AI transcription/translation (gpt-4o-audio-preview) → TTS generation (tts-1-hd).

## Key Documents

- **[DESIGN.md](./DESIGN.md)** - Full product specification
- **[Implementation Plan](/.claude/plans/reflective-bouncing-cray.md)** - Detailed technical plan with all 8 phases

## Current State

**Phase 1-2 Complete** - Backend core infrastructure and audio processing working.

### Working Features

- Project CRUD: `POST/GET/DELETE /api/projects`
- Video upload: `POST /api/projects/{id}/upload`
- Audio extraction: `POST /api/projects/{id}/extract-audio`
- Segment CRUD: `POST/GET/DELETE /api/projects/{id}/segments`
- Segment audio extraction: `POST /api/segments/{id}/extract`
- File serving: `GET /api/files/{project_id}/{audio|segments|output}/{filename}`
- Translation/analysis updates: `PUT /api/segments/{id}/{translation|analysis}`
- SQLite + async SQLAlchemy with Alembic migrations
- Tests passing (31 tests), pre-commit hooks configured

### Not Yet Implemented

- Phase 3: OpenAI integration (analysis + TTS)
- Phase 4-7: Frontend (React + WaveSurfer.js)
- Phase 8: Docker

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
cd backend
make test      # Run tests
make format    # Ruff lint + format
make run       # uvicorn dev server
make migrate   # Apply migrations
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

## Next Steps (Phase 3)

1. Create `OpenAIService` in `app/services/openai_service.py`:
    - `analyze_audio(audio_path) -> AnalysisResult` (transcription, tone, emotion, style)
    - `generate_tts(text, voice, instructions) -> audio_path`
    - Use OpenAI's async client

2. Add endpoints:
    - `POST /api/segments/{id}/analyze` - Trigger AI analysis
    - `POST /api/segments/{id}/generate-tts` - Generate TTS audio

3. Write mocked tests using `respx` for OpenAI API calls

## API Design Reference

Segment status flow:

```
created → extracting → extracted → analyzing → analyzed → generating_tts → completed
                                                                        ↘ error
```

Timestamp filename format: `segment_{MM}m{SS}s{mmm}ms.wav`
Example: 15.32 seconds → `segment_00m15s320ms.wav`
