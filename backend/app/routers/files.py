from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse

from app.config import Settings, get_settings
from app.services.file_service import FileService

router = APIRouter(prefix="/files", tags=["files"])


def get_file_service(
    settings: Annotated[Settings, Depends(get_settings)],
) -> FileService:
    return FileService(settings)


@router.get("/{project_id}/audio/{filename}")
async def get_audio_file(
    project_id: str,
    filename: str,
    file_service: Annotated[FileService, Depends(get_file_service)],
) -> FileResponse:
    """Serve project audio file."""
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
) -> FileResponse:
    """Serve segment audio file."""
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
) -> FileResponse:
    """Serve TTS output file."""
    file_path = file_service.get_file_path(project_id, "output", filename)
    media_type = "audio/mpeg" if filename.endswith(".mp3") else "audio/wav"
    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=filename,
    )
