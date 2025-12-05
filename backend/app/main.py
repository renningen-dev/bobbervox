import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import create_tables
from app.middleware.auth import FirebaseAuthMiddleware, init_firebase
from app.routers import files, projects, segments, voices
from app.routers import settings as settings_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    settings.projects_dir.mkdir(parents=True, exist_ok=True)
    settings.voices_dir.mkdir(parents=True, exist_ok=True)
    init_firebase()
    await create_tables()
    yield


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="BobberVox API",
        description="Video dubbing workflow API with AI-powered transcription and TTS",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_middleware(FirebaseAuthMiddleware)

    app.include_router(projects.router, prefix="/api")
    app.include_router(segments.router, prefix="/api")
    app.include_router(files.router, prefix="/api")
    app.include_router(settings_router.router, prefix="/api")
    app.include_router(voices.router, prefix="/api")

    return app


app = create_app()
