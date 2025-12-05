from __future__ import annotations

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.app_settings import DEFAULT_CONTEXT, AppSettings


class SettingsService:
    """Service for managing application settings."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_settings(self) -> AppSettings:
        """Get or create app settings."""
        result = await self.session.execute(select(AppSettings).where(AppSettings.id == 1))
        settings = result.scalar_one_or_none()

        if not settings:
            # Create default settings
            settings = AppSettings(
                id=1,
                openai_api_key="",
                context_description=DEFAULT_CONTEXT,
            )
            self.session.add(settings)
            await self.session.flush()
            await self.session.refresh(settings)

        return settings

    async def update_settings(
        self,
        openai_api_key: Optional[str] = None,
        context_description: Optional[str] = None,
    ) -> AppSettings:
        """Update app settings."""
        settings = await self.get_settings()

        if openai_api_key is not None:
            settings.openai_api_key = openai_api_key
        if context_description is not None:
            settings.context_description = context_description

        await self.session.flush()
        await self.session.refresh(settings)
        return settings

    async def get_openai_api_key(self) -> str:
        """Get OpenAI API key from settings."""
        settings = await self.get_settings()
        return settings.openai_api_key

    async def get_context_description(self) -> str:
        """Get context description for analysis."""
        settings = await self.get_settings()
        return settings.context_description
