from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Form, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.database import get_async_session
from app.dependencies.auth import CurrentUser, get_current_user
from app.repositories.custom_voice_repo import CustomVoiceRepository
from app.schemas.custom_voice import CustomVoiceRead, CustomVoiceUpdate
from app.services.custom_voice_service import CustomVoiceService
from app.utils.exceptions import ProcessingError

router = APIRouter(prefix="/voices", tags=["voices"])


def get_custom_voice_service(
    session: Annotated[AsyncSession, Depends(get_async_session)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> CustomVoiceService:
    repo = CustomVoiceRepository(session)
    return CustomVoiceService(repo, settings)


@router.post("", response_model=CustomVoiceRead, status_code=status.HTTP_201_CREATED)
async def create_voice(
    file: UploadFile,
    name: Annotated[str, Form()],
    service: Annotated[CustomVoiceService, Depends(get_custom_voice_service)],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    description: Annotated[Optional[str], Form()] = None,
) -> CustomVoiceRead:
    """Upload a new custom voice sample."""
    # Validate file type
    if not file.filename or not file.filename.lower().endswith((".wav", ".mp3", ".ogg", ".m4a")):
        raise ProcessingError("Invalid file type. Please upload a WAV, MP3, OGG, or M4A file.")

    # Read file content
    audio_data = await file.read()
    if len(audio_data) > 50 * 1024 * 1024:  # 50MB limit
        raise ProcessingError("File too large. Maximum size is 50MB.")

    voice = await service.create(
        user_id=current_user.user_id,
        name=name,
        audio_data=audio_data,
        description=description,
    )
    return CustomVoiceRead.model_validate(voice)


@router.get("", response_model=list[CustomVoiceRead])
async def list_voices(
    service: Annotated[CustomVoiceService, Depends(get_custom_voice_service)],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> list[CustomVoiceRead]:
    """List all custom voices for the current user."""
    voices = await service.list_by_user(current_user.user_id)
    return [CustomVoiceRead.model_validate(v) for v in voices]


@router.get("/{voice_id}", response_model=CustomVoiceRead)
async def get_voice(
    voice_id: str,
    service: Annotated[CustomVoiceService, Depends(get_custom_voice_service)],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> CustomVoiceRead:
    """Get a custom voice by ID."""
    voice = await service.get_by_id(voice_id, current_user.user_id)
    return CustomVoiceRead.model_validate(voice)


@router.get("/{voice_id}/audio")
async def get_voice_audio(
    voice_id: str,
    service: Annotated[CustomVoiceService, Depends(get_custom_voice_service)],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> FileResponse:
    """Get the audio file for a custom voice."""
    voice = await service.get_by_id(voice_id, current_user.user_id)
    file_path = service.get_voice_file_path(voice)
    if not file_path.exists():
        raise ProcessingError("Voice file not found")
    return FileResponse(file_path, media_type="audio/wav")


@router.patch("/{voice_id}", response_model=CustomVoiceRead)
async def update_voice(
    voice_id: str,
    data: CustomVoiceUpdate,
    service: Annotated[CustomVoiceService, Depends(get_custom_voice_service)],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> CustomVoiceRead:
    """Update a custom voice."""
    voice = await service.update(
        voice_id=voice_id,
        user_id=current_user.user_id,
        name=data.name,
        description=data.description,
    )
    return CustomVoiceRead.model_validate(voice)


@router.delete("/{voice_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_voice(
    voice_id: str,
    service: Annotated[CustomVoiceService, Depends(get_custom_voice_service)],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> None:
    """Delete a custom voice."""
    await service.delete(voice_id, current_user.user_id)
