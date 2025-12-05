from __future__ import annotations

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import CustomVoice


class CustomVoiceRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        user_id: str,
        name: str,
        file_path: str,
        description: Optional[str] = None,
    ) -> CustomVoice:
        voice = CustomVoice(
            user_id=user_id,
            name=name,
            file_path=file_path,
            description=description,
        )
        self.session.add(voice)
        await self.session.flush()
        return voice

    async def get_by_id(self, voice_id: str, user_id: str) -> Optional[CustomVoice]:
        result = await self.session.execute(
            select(CustomVoice).where(CustomVoice.id == voice_id, CustomVoice.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def list_by_user(self, user_id: str) -> list[CustomVoice]:
        result = await self.session.execute(
            select(CustomVoice)
            .where(CustomVoice.user_id == user_id)
            .order_by(CustomVoice.created_at.desc())
        )
        return list(result.scalars().all())

    async def delete(self, voice: CustomVoice) -> None:
        await self.session.delete(voice)

    async def update(self, voice: CustomVoice, **kwargs) -> CustomVoice:
        for key, value in kwargs.items():
            if value is not None:
                setattr(voice, key, value)
        await self.session.flush()
        await self.session.refresh(voice)
        return voice
