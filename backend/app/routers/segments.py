from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.database import get_async_session
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

router = APIRouter(tags=["segments"])


def get_project_service(
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> ProjectService:
    repo = ProjectRepository(session)
    return ProjectService(repo)


def get_segment_service(
    session: Annotated[AsyncSession, Depends(get_async_session)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> SegmentService:
    repo = SegmentRepository(session)
    ffmpeg = FFmpegService(settings)
    openai = OpenAIService(settings)
    return SegmentService(repo, ffmpeg, settings, openai)


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
) -> SegmentRead:
    """Create a new segment for a project."""
    project = await project_service.get_by_id(project_id)
    segment = await segment_service.create(
        project=project,
        start_time=data.start_time,
        end_time=data.end_time,
    )
    return SegmentRead.model_validate(segment)


@router.get("/projects/{project_id}/segments", response_model=list[SegmentRead])
async def list_segments(
    project_id: str,
    project_service: Annotated[ProjectService, Depends(get_project_service)],
    segment_service: Annotated[SegmentService, Depends(get_segment_service)],
) -> list[SegmentRead]:
    """List all segments for a project."""
    await project_service.get_by_id(project_id)  # Verify project exists
    segments = await segment_service.list_by_project(project_id)
    return [SegmentRead.model_validate(s) for s in segments]


@router.get("/segments/{segment_id}", response_model=SegmentRead)
async def get_segment(
    segment_id: str,
    segment_service: Annotated[SegmentService, Depends(get_segment_service)],
) -> SegmentRead:
    """Get a segment by ID."""
    segment = await segment_service.get_by_id(segment_id)
    return SegmentRead.model_validate(segment)


@router.delete("/segments/{segment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_segment(
    segment_id: str,
    segment_service: Annotated[SegmentService, Depends(get_segment_service)],
) -> None:
    """Delete a segment."""
    await segment_service.delete(segment_id)


@router.post("/segments/{segment_id}/extract", response_model=SegmentRead)
async def extract_segment_audio(
    segment_id: str,
    project_service: Annotated[ProjectService, Depends(get_project_service)],
    segment_service: Annotated[SegmentService, Depends(get_segment_service)],
) -> SegmentRead:
    """Extract audio for a segment from project audio."""
    segment = await segment_service.get_by_id(segment_id)
    project = await project_service.get_by_id(segment.project_id)
    segment = await segment_service.extract_audio(segment, project)
    return SegmentRead.model_validate(segment)


@router.put("/segments/{segment_id}/translation", response_model=SegmentRead)
async def update_translation(
    segment_id: str,
    data: SegmentUpdateTranslation,
    segment_service: Annotated[SegmentService, Depends(get_segment_service)],
) -> SegmentRead:
    """Update segment translation."""
    segment = await segment_service.update_translation(
        segment_id,
        data.translated_text,
    )
    return SegmentRead.model_validate(segment)


@router.put("/segments/{segment_id}/analysis", response_model=SegmentRead)
async def update_analysis(
    segment_id: str,
    data: SegmentUpdateAnalysis,
    segment_service: Annotated[SegmentService, Depends(get_segment_service)],
) -> SegmentRead:
    """Update segment analysis."""
    segment = await segment_service.update_analysis(
        segment_id,
        data.model_dump(exclude_none=True),
    )
    return SegmentRead.model_validate(segment)


@router.post("/segments/{segment_id}/analyze", response_model=SegmentRead)
async def analyze_segment(
    segment_id: str,
    segment_service: Annotated[SegmentService, Depends(get_segment_service)],
) -> SegmentRead:
    """Analyze segment audio using OpenAI gpt-4o-audio-preview."""
    segment = await segment_service.get_by_id(segment_id)
    segment = await segment_service.analyze_segment(segment)
    return SegmentRead.model_validate(segment)


@router.post("/segments/{segment_id}/generate-tts", response_model=SegmentRead)
async def generate_tts(
    segment_id: str,
    data: TTSRequest,
    segment_service: Annotated[SegmentService, Depends(get_segment_service)],
) -> SegmentRead:
    """Generate TTS audio for segment using OpenAI tts-1-hd."""
    segment = await segment_service.get_by_id(segment_id)
    segment = await segment_service.generate_tts(segment, voice=data.voice)
    return SegmentRead.model_validate(segment)
