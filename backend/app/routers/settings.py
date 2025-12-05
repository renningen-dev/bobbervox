from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.schemas.settings import SettingsResponse, SettingsUpdate
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


@router.get("", response_model=SettingsResponse)
async def get_settings(
    service: Annotated[SettingsService, Depends(get_settings_service)],
) -> SettingsResponse:
    settings = await service.get_settings()
    return SettingsResponse(
        openai_api_key=mask_api_key(settings.openai_api_key),
        openai_api_key_set=bool(settings.openai_api_key),
        context_description=settings.context_description,
    )


@router.put("", response_model=SettingsResponse)
async def update_settings(
    data: SettingsUpdate,
    service: Annotated[SettingsService, Depends(get_settings_service)],
) -> SettingsResponse:
    settings = await service.update_settings(
        openai_api_key=data.openai_api_key,
        context_description=data.context_description,
    )
    return SettingsResponse(
        openai_api_key=mask_api_key(settings.openai_api_key),
        openai_api_key_set=bool(settings.openai_api_key),
        context_description=settings.context_description,
    )
