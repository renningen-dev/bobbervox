from typing import Annotated

from fastapi import APIRouter, Depends, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.database import get_async_session
from app.repositories.project_repo import ProjectRepository
from app.schemas import ProjectCreate, ProjectList, ProjectRead
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


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreate,
    service: Annotated[ProjectService, Depends(get_project_service)],
) -> ProjectRead:
    project = await service.create(data.name)
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
            created_at=project.created_at,
            source_video=project.source_video,
            segment_count=segment_count,
        )
        for project, segment_count in projects
    ]


@router.get("/{project_id}", response_model=ProjectRead)
async def get_project(
    project_id: str,
    service: Annotated[ProjectService, Depends(get_project_service)],
) -> ProjectRead:
    project = await service.get_by_id(project_id)
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
