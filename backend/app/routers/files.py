import tempfile
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.database import get_async_session
from app.dependencies.auth import CurrentUser, get_current_user
from app.repositories.project_repo import ProjectRepository
from app.services.file_service import FileService
from app.services.project_service import ProjectService
from app.utils.exceptions import ProcessingError

router = APIRouter(prefix="/files", tags=["files"])


def get_file_service(
    settings: Annotated[Settings, Depends(get_settings)],
) -> FileService:
    return FileService(settings)


def get_project_service(
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> ProjectService:
    repo = ProjectRepository(session)
    return ProjectService(repo)


@router.get("/{project_id}/audio/{filename}")
async def get_audio_file(
    project_id: str,
    filename: str,
    file_service: Annotated[FileService, Depends(get_file_service)],
    project_service: Annotated[ProjectService, Depends(get_project_service)],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> FileResponse:
    """Serve project audio file."""
    # Verify user owns the project
    await project_service.get_by_id(project_id, current_user.user_id)
    file_path = file_service.get_file_path(project_id, "audio", filename)
    return FileResponse(
        path=file_path,
        media_type="audio/wav",
        filename=filename,
    )


@router.get("/{project_id}/segments/{filename}")
async def get_segment_file(
    project_id: str,
    filename: str,
    file_service: Annotated[FileService, Depends(get_file_service)],
    project_service: Annotated[ProjectService, Depends(get_project_service)],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> FileResponse:
    """Serve segment audio file."""
    # Verify user owns the project
    await project_service.get_by_id(project_id, current_user.user_id)
    file_path = file_service.get_file_path(project_id, "segments", filename)
    return FileResponse(
        path=file_path,
        media_type="audio/wav",
        filename=filename,
    )


@router.get("/{project_id}/output/{filename}")
async def get_output_file(
    project_id: str,
    filename: str,
    file_service: Annotated[FileService, Depends(get_file_service)],
    project_service: Annotated[ProjectService, Depends(get_project_service)],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    download: bool = False,
) -> FileResponse:
    """Serve TTS output file."""
    # Verify user owns the project
    await project_service.get_by_id(project_id, current_user.user_id)
    file_path = file_service.get_file_path(project_id, "output", filename)
    media_type = "audio/mpeg" if filename.endswith(".mp3") else "audio/wav"

    headers = {}
    if download:
        headers["Content-Disposition"] = f'attachment; filename="{filename}"'

    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=filename,
        headers=headers,
    )


@router.get("/{project_id}/download-all")
async def download_all_tts(
    project_id: str,
    settings: Annotated[Settings, Depends(get_settings)],
    project_service: Annotated[ProjectService, Depends(get_project_service)],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> FileResponse:
    """Download all TTS output files as a zip archive."""
    import subprocess

    # Verify user owns the project
    await project_service.get_by_id(project_id, current_user.user_id)

    output_dir = settings.projects_dir / project_id / "output"

    if not output_dir.exists():
        raise ProcessingError("No output files found for this project")

    # Get all audio files in the output directory
    audio_files = list(output_dir.glob("*.mp3")) + list(output_dir.glob("*.wav"))

    if not audio_files:
        raise ProcessingError("No TTS audio files found")

    # Create a temporary zip file
    temp_dir = Path(tempfile.gettempdir())
    zip_path = temp_dir / f"{project_id}_tts_output.zip"

    # Use system zip command (-j stores files without directory structure)
    try:
        subprocess.run(
            ["zip", "-j", str(zip_path)] + [str(f) for f in audio_files],
            check=True,
            capture_output=True,
        )
    except subprocess.CalledProcessError as e:
        raise ProcessingError(f"Failed to create zip archive: {e.stderr.decode()}") from e

    return FileResponse(
        path=zip_path,
        media_type="application/zip",
        filename=f"{project_id}_tts_output.zip",
    )
