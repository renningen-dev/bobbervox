from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.database import get_async_session
from app.dependencies.auth import CurrentUser, get_current_user
from app.schemas.settings import ChatterBoxHealthResponse, SettingsResponse, SettingsUpdate
from app.services.chatterbox_service import ChatterBoxService
from app.services.settings_service import SettingsService

router = APIRouter(prefix="/settings", tags=["settings"])


def get_settings_service(
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> SettingsService:
    return SettingsService(session)


def mask_api_key(key: str) -> str:
    """Mask API key for display, showing only last 4 characters."""
    if not key or len(key) < 8:
        return ""
    return "*" * (len(key) - 4) + key[-4:]


async def check_chatterbox_health(settings: Settings) -> bool:
    """Check if ChatterBox server is reachable."""
    service = ChatterBoxService(base_url=settings.chatterbox_base_url)
    try:
        return await service.check_health()
    finally:
        await service.close()


@router.get("", response_model=SettingsResponse)
async def get_settings_endpoint(
    service: Annotated[SettingsService, Depends(get_settings_service)],
    settings: Annotated[Settings, Depends(get_settings)],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> SettingsResponse:
    user_settings = await service.get_settings(current_user.user_id)
    chatterbox_available = await check_chatterbox_health(settings)
    return SettingsResponse(
        openai_api_key=mask_api_key(user_settings.openai_api_key),
        openai_api_key_set=bool(user_settings.openai_api_key),
        context_description=user_settings.context_description,
        tts_provider=user_settings.tts_provider,
        chatterbox_available=chatterbox_available,
    )


@router.put("", response_model=SettingsResponse)
async def update_settings(
    data: SettingsUpdate,
    service: Annotated[SettingsService, Depends(get_settings_service)],
    settings: Annotated[Settings, Depends(get_settings)],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> SettingsResponse:
    user_settings = await service.update_settings(
        user_id=current_user.user_id,
        openai_api_key=data.openai_api_key,
        context_description=data.context_description,
        tts_provider=data.tts_provider,
    )
    chatterbox_available = await check_chatterbox_health(settings)
    return SettingsResponse(
        openai_api_key=mask_api_key(user_settings.openai_api_key),
        openai_api_key_set=bool(user_settings.openai_api_key),
        context_description=user_settings.context_description,
        tts_provider=user_settings.tts_provider,
        chatterbox_available=chatterbox_available,
    )


@router.get("/chatterbox/health", response_model=ChatterBoxHealthResponse)
async def check_chatterbox_health_endpoint(
    settings: Annotated[Settings, Depends(get_settings)],
    _current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ChatterBoxHealthResponse:
    """Check if ChatterBox TTS server is available."""
    available = await check_chatterbox_health(settings)
    return ChatterBoxHealthResponse(
        available=available,
        url=settings.chatterbox_base_url,
    )
