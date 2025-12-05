from typing import Annotated

from fastapi import APIRouter, Depends, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.database import get_async_session
from app.repositories.project_repo import ProjectRepository
from app.schemas import ProjectCreate, ProjectList, ProjectRead
from app.schemas.project import ProjectReadWithSegments, ProjectUpdate
from app.services.ffmpeg_service import FFmpegService
from app.services.file_service import FileService
from app.services.project_service import ProjectService

router = APIRouter(prefix="/projects", tags=["projects"])


def get_project_service(
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> ProjectService:
    repo = ProjectRepository(session)
    return ProjectService(repo)


def get_file_service(
    settings: Annotated[Settings, Depends(get_settings)],
) -> FileService:
    return FileService(settings)


def get_ffmpeg_service(
    settings: Annotated[Settings, Depends(get_settings)],
) -> FFmpegService:
    return FFmpegService(settings)


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreate,
    service: Annotated[ProjectService, Depends(get_project_service)],
) -> ProjectRead:
    project = await service.create(
        name=data.name,
        source_language=data.source_language,
        target_language=data.target_language,
    )
    return ProjectRead.model_validate(project)


@router.get("", response_model=list[ProjectList])
async def list_projects(
    service: Annotated[ProjectService, Depends(get_project_service)],
) -> list[ProjectList]:
    projects = await service.list_all()
    return [
        ProjectList(
            id=project.id,
            name=project.name,
            source_language=project.source_language,
            target_language=project.target_language,
            created_at=project.created_at,
            source_video=project.source_video,
            extracted_audio=project.extracted_audio,
            segment_count=segment_count,
        )
        for project, segment_count in projects
    ]


@router.get("/{project_id}", response_model=ProjectReadWithSegments)
async def get_project(
    project_id: str,
    service: Annotated[ProjectService, Depends(get_project_service)],
) -> ProjectReadWithSegments:
    project = await service.get_by_id_with_segments(project_id)
    return ProjectReadWithSegments.model_validate(project)


@router.patch("/{project_id}", response_model=ProjectRead)
async def update_project(
    project_id: str,
    data: ProjectUpdate,
    service: Annotated[ProjectService, Depends(get_project_service)],
) -> ProjectRead:
    project = await service.update(
        project_id=project_id,
        name=data.name,
        source_language=data.source_language,
        target_language=data.target_language,
    )
    return ProjectRead.model_validate(project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    service: Annotated[ProjectService, Depends(get_project_service)],
) -> None:
    await service.delete(project_id)


@router.post("/{project_id}/upload", response_model=ProjectRead)
async def upload_video(
    project_id: str,
    file: UploadFile,
    service: Annotated[ProjectService, Depends(get_project_service)],
    file_service: Annotated[FileService, Depends(get_file_service)],
) -> ProjectRead:
    project = await service.get_by_id(project_id)
    relative_path = await file_service.save_upload(
        project_id,
        file.file,
        file.filename or "video.mp4",
    )
    project = await service.update_source_video(project_id, relative_path)
    return ProjectRead.model_validate(project)


@router.post("/{project_id}/extract-audio", response_model=ProjectRead)
async def extract_audio(
    project_id: str,
    service: Annotated[ProjectService, Depends(get_project_service)],
    file_service: Annotated[FileService, Depends(get_file_service)],
    ffmpeg_service: Annotated[FFmpegService, Depends(get_ffmpeg_service)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> ProjectRead:
    """Extract audio from uploaded video."""
    project = await service.get_by_id(project_id)

    if not project.source_video:
        from app.utils.exceptions import ProcessingError

        raise ProcessingError("No video uploaded for this project")

    video_path = settings.projects_dir / project.source_video
    audio_dir = file_service.get_audio_path(project_id)
    audio_path = audio_dir / "full_audio.wav"

    await ffmpeg_service.extract_audio(video_path, audio_path)

    relative_path = str(audio_path.relative_to(settings.projects_dir))
    project = await service.update_extracted_audio(project_id, relative_path)
    return ProjectRead.model_validate(project)
