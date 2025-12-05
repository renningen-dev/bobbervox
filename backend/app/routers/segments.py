from typing import Annotated, Optional

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.database import get_async_session
from app.dependencies.auth import CurrentUser, get_current_user
from app.prompts import build_system_prompt, get_user_prompt
from app.repositories.custom_voice_repo import CustomVoiceRepository
from app.repositories.project_repo import ProjectRepository
from app.repositories.segment_repo import SegmentRepository
from app.schemas.segment import (
    SegmentCreate,
    SegmentRead,
    SegmentUpdateAnalysis,
    SegmentUpdateTranslation,
    TTSRequest,
)
from app.services.ffmpeg_service import FFmpegService
from app.services.openai_service import OpenAIService
from app.services.project_service import ProjectService
from app.services.segment_service import SegmentService
from app.services.settings_service import SettingsService
from app.utils.exceptions import NotFoundError, ProcessingError

router = APIRouter(tags=["segments"])


def get_project_service(
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> ProjectService:
    repo = ProjectRepository(session)
    return ProjectService(repo)


def get_settings_service(
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> SettingsService:
    return SettingsService(session)


def get_custom_voice_repo(
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> CustomVoiceRepository:
    return CustomVoiceRepository(session)


def get_segment_service(
    session: Annotated[AsyncSession, Depends(get_async_session)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> SegmentService:
    repo = SegmentRepository(session)
    ffmpeg = FFmpegService(settings)
    # OpenAI service will be created per-request with project context
    return SegmentService(repo, ffmpeg, settings, openai=None)


@router.post(
    "/projects/{project_id}/segments",
    response_model=SegmentRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_segment(
    project_id: str,
    data: SegmentCreate,
    project_service: Annotated[ProjectService, Depends(get_project_service)],
    segment_service: Annotated[SegmentService, Depends(get_segment_service)],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> SegmentRead:
    """Create a new segment for a project and automatically extract audio."""
    project = await project_service.get_by_id(project_id, current_user.user_id)
    segment = await segment_service.create(
        project=project,
        start_time=data.start_time,
        end_time=data.end_time,
    )
    # Automatically extract audio if project has extracted audio
    if project.extracted_audio:
        segment = await segment_service.extract_audio(segment, project)
    return SegmentRead.model_validate(segment)


@router.get("/projects/{project_id}/segments", response_model=list[SegmentRead])
async def list_segments(
    project_id: str,
    project_service: Annotated[ProjectService, Depends(get_project_service)],
    segment_service: Annotated[SegmentService, Depends(get_segment_service)],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> list[SegmentRead]:
    """List all segments for a project."""
    await project_service.get_by_id(project_id, current_user.user_id)
    segments = await segment_service.list_by_project(project_id)
    return [SegmentRead.model_validate(s) for s in segments]


@router.get("/segments/{segment_id}", response_model=SegmentRead)
async def get_segment(
    segment_id: str,
    project_service: Annotated[ProjectService, Depends(get_project_service)],
    segment_service: Annotated[SegmentService, Depends(get_segment_service)],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> SegmentRead:
    """Get a segment by ID."""
    segment = await segment_service.get_by_id(segment_id)
    # Verify user owns the project
    await project_service.get_by_id(segment.project_id, current_user.user_id)
    return SegmentRead.model_validate(segment)


@router.delete("/segments/{segment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_segment(
    segment_id: str,
    project_service: Annotated[ProjectService, Depends(get_project_service)],
    segment_service: Annotated[SegmentService, Depends(get_segment_service)],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> None:
    """Delete a segment."""
    segment = await segment_service.get_by_id(segment_id)
    # Verify user owns the project
    await project_service.get_by_id(segment.project_id, current_user.user_id)
    await segment_service.delete(segment_id)


@router.post("/segments/{segment_id}/extract", response_model=SegmentRead)
async def extract_segment_audio(
    segment_id: str,
    project_service: Annotated[ProjectService, Depends(get_project_service)],
    segment_service: Annotated[SegmentService, Depends(get_segment_service)],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> SegmentRead:
    """Extract audio for a segment from project audio."""
    segment = await segment_service.get_by_id(segment_id)
    project = await project_service.get_by_id(segment.project_id, current_user.user_id)
    segment = await segment_service.extract_audio(segment, project)
    return SegmentRead.model_validate(segment)


@router.put("/segments/{segment_id}/translation", response_model=SegmentRead)
async def update_translation(
    segment_id: str,
    data: SegmentUpdateTranslation,
    project_service: Annotated[ProjectService, Depends(get_project_service)],
    segment_service: Annotated[SegmentService, Depends(get_segment_service)],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> SegmentRead:
    """Update segment translation."""
    segment = await segment_service.get_by_id(segment_id)
    # Verify user owns the project
    await project_service.get_by_id(segment.project_id, current_user.user_id)
    segment = await segment_service.update_translation(
        segment_id,
        data.translated_text,
    )
    return SegmentRead.model_validate(segment)


@router.put("/segments/{segment_id}/analysis", response_model=SegmentRead)
async def update_analysis(
    segment_id: str,
    data: SegmentUpdateAnalysis,
    project_service: Annotated[ProjectService, Depends(get_project_service)],
    segment_service: Annotated[SegmentService, Depends(get_segment_service)],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> SegmentRead:
    """Update segment analysis."""
    segment = await segment_service.get_by_id(segment_id)
    # Verify user owns the project
    await project_service.get_by_id(segment.project_id, current_user.user_id)
    segment = await segment_service.update_analysis(
        segment_id,
        data.model_dump(exclude_none=True),
    )
    return SegmentRead.model_validate(segment)


@router.post("/segments/{segment_id}/analyze", response_model=SegmentRead)
async def analyze_segment(
    segment_id: str,
    project_service: Annotated[ProjectService, Depends(get_project_service)],
    settings_service: Annotated[SettingsService, Depends(get_settings_service)],
    segment_service: Annotated[SegmentService, Depends(get_segment_service)],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> SegmentRead:
    """Analyze segment audio using OpenAI gpt-4o-audio-preview.

    Returns segment with status 'analyzed' on success or 'error' on failure.
    Does not raise exceptions - always returns the segment.
    """
    segment = await segment_service.get_by_id(segment_id)

    # Get project for language settings (also verifies ownership)
    project = await project_service.get_by_id(segment.project_id, current_user.user_id)

    # Get user settings for context and API key
    user_settings = await settings_service.get_settings(current_user.user_id)
    if not user_settings.openai_api_key:
        raise ProcessingError("OpenAI API key not configured in settings")

    # Build prompts dynamically
    system_prompt = build_system_prompt(
        context=user_settings.context_description,
        source_language=project.source_language,
        target_language=project.target_language,
    )
    user_prompt = get_user_prompt()

    # Create OpenAI service with project-specific prompts
    openai_service = OpenAIService(
        api_key=user_settings.openai_api_key,
        system_prompt=system_prompt,
        user_prompt=user_prompt,
    )

    segment = await segment_service.analyze_segment(segment, openai=openai_service)
    return SegmentRead.model_validate(segment)


@router.post("/segments/{segment_id}/generate-tts", response_model=SegmentRead)
async def generate_tts(
    segment_id: str,
    data: TTSRequest,
    project_service: Annotated[ProjectService, Depends(get_project_service)],
    settings_service: Annotated[SettingsService, Depends(get_settings_service)],
    segment_service: Annotated[SegmentService, Depends(get_segment_service)],
    custom_voice_repo: Annotated[CustomVoiceRepository, Depends(get_custom_voice_repo)],
    settings: Annotated[Settings, Depends(get_settings)],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> SegmentRead:
    """Generate TTS audio for segment.

    Uses OpenAI gpt-4o-mini-tts or ChatterBox based on user settings.
    """
    segment = await segment_service.get_by_id(segment_id)
    # Verify user owns the project and get target language
    project = await project_service.get_by_id(segment.project_id, current_user.user_id)

    # Get user settings for TTS provider
    user_settings = await settings_service.get_settings(current_user.user_id)

    # Resolve custom voice to file path if needed
    voice = data.voice
    custom_voice_path: Optional[str] = None
    if voice.startswith("custom:"):
        # Format: custom:voice_id:voice_name
        parts = voice.split(":", 2)
        if len(parts) >= 2:
            voice_id = parts[1]
            custom_voice = await custom_voice_repo.get_by_id(voice_id, current_user.user_id)
            if not custom_voice:
                raise NotFoundError(f"Custom voice not found: {voice_id}")
            # Get absolute path to the custom voice file
            custom_voice_path = str(settings.voices_dir / custom_voice.file_path)

    if user_settings.tts_provider == "chatterbox":
        # Use ChatterBox TTS (local)
        segment = await segment_service.generate_tts_chatterbox(
            segment,
            voice=voice,
            custom_voice_path=custom_voice_path,
        )
    else:
        # Use OpenAI TTS (default)
        if not user_settings.openai_api_key:
            raise ProcessingError("OpenAI API key not configured in settings")

        # Create OpenAI service with API key
        openai_service = OpenAIService(api_key=user_settings.openai_api_key)

        # Set target language from project if not provided in request
        if not data.target_language:
            data.target_language = project.target_language

        # Build TTS instructions from analysis fields
        instructions = data.build_instructions()

        segment = await segment_service.generate_tts(
            segment,
            voice=voice,
            instructions=instructions if instructions else None,
            openai=openai_service,
        )
    return SegmentRead.model_validate(segment)
