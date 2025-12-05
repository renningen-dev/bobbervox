from __future__ import annotations

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.app_settings import DEFAULT_CONTEXT, UserSettings


class SettingsService:
    """Service for managing per-user settings."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_settings(self, user_id: str) -> UserSettings:
        """Get or create user settings."""
        result = await self.session.execute(
            select(UserSettings).where(UserSettings.user_id == user_id)
        )
        settings = result.scalar_one_or_none()

        if not settings:
            # Create default settings for user
            settings = UserSettings(
                user_id=user_id,
                openai_api_key="",
                context_description=DEFAULT_CONTEXT,
            )
            self.session.add(settings)
            await self.session.flush()
            await self.session.refresh(settings)

        return settings

    async def update_settings(
        self,
        user_id: str,
        openai_api_key: Optional[str] = None,
        context_description: Optional[str] = None,
    ) -> UserSettings:
        """Update user settings."""
        settings = await self.get_settings(user_id)

        if openai_api_key is not None:
            settings.openai_api_key = openai_api_key
        if context_description is not None:
            settings.context_description = context_description

        await self.session.flush()
        await self.session.refresh(settings)
        return settings

    async def get_openai_api_key(self, user_id: str) -> str:
        """Get OpenAI API key from user settings."""
        settings = await self.get_settings(user_id)
        return settings.openai_api_key

    async def get_context_description(self, user_id: str) -> str:
        """Get context description for analysis."""
        settings = await self.get_settings(user_id)
        return settings.context_description
