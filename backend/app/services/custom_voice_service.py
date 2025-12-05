from __future__ import annotations

import contextlib
import uuid
from pathlib import Path
from typing import Optional

import aiofiles
import aiofiles.os

from app.config import Settings
from app.models import CustomVoice
from app.repositories.custom_voice_repo import CustomVoiceRepository
from app.utils.exceptions import NotFoundError, ProcessingError


class CustomVoiceService:
    def __init__(self, repo: CustomVoiceRepository, settings: Settings) -> None:
        self.repo = repo
        self.settings = settings

    def _get_user_voices_dir(self, user_id: str) -> Path:
        """Get the voices directory for a user."""
        return self.settings.voices_dir / user_id

    async def _ensure_user_voices_dir(self, user_id: str) -> Path:
        """Ensure user voices directory exists."""
        user_dir = self._get_user_voices_dir(user_id)
        if not user_dir.exists():
            user_dir.mkdir(parents=True, exist_ok=True)
        return user_dir

    async def create(
        self,
        user_id: str,
        name: str,
        audio_data: bytes,
        description: Optional[str] = None,
    ) -> CustomVoice:
        """Create a new custom voice from uploaded audio."""
        user_dir = await self._ensure_user_voices_dir(user_id)

        # Generate unique filename
        voice_id = str(uuid.uuid4())
        filename = f"{voice_id}.wav"
        file_path = user_dir / filename

        # Save audio file
        try:
            async with aiofiles.open(file_path, "wb") as f:
                await f.write(audio_data)
        except Exception as e:
            raise ProcessingError(f"Failed to save voice file: {e}") from e

        # Store relative path (user_id/filename)
        relative_path = f"{user_id}/{filename}"

        # Create database record
        voice = await self.repo.create(
            user_id=user_id,
            name=name,
            file_path=relative_path,
            description=description,
        )
        return voice

    async def get_by_id(self, voice_id: str, user_id: str) -> CustomVoice:
        """Get a custom voice by ID."""
        voice = await self.repo.get_by_id(voice_id, user_id)
        if not voice:
            raise NotFoundError(f"Custom voice not found: {voice_id}")
        return voice

    async def list_by_user(self, user_id: str) -> list[CustomVoice]:
        """List all custom voices for a user."""
        return await self.repo.list_by_user(user_id)

    async def update(
        self,
        voice_id: str,
        user_id: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
    ) -> CustomVoice:
        """Update a custom voice."""
        voice = await self.get_by_id(voice_id, user_id)
        return await self.repo.update(voice, name=name, description=description)

    async def delete(self, voice_id: str, user_id: str) -> None:
        """Delete a custom voice and its file."""
        voice = await self.get_by_id(voice_id, user_id)

        # Delete file
        file_path = self.settings.voices_dir / voice.file_path
        if file_path.exists():
            with contextlib.suppress(Exception):
                await aiofiles.os.remove(file_path)

        # Delete database record
        await self.repo.delete(voice)

    def get_voice_file_path(self, voice: CustomVoice) -> Path:
        """Get the full path to a voice file."""
        return self.settings.voices_dir / voice.file_path
