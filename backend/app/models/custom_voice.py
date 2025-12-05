from __future__ import annotations

from typing import Optional

from sqlalchemy import Index, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class CustomVoice(Base, UUIDMixin, TimestampMixin):
    """User-uploaded custom voice for ChatterBox TTS."""

    __tablename__ = "custom_voices"
    __table_args__ = (Index("ix_custom_voices_user_id", "user_id"),)

    user_id: Mapped[str] = mapped_column(String(128), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    # Relative path to the voice file within the voices directory
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    # Optional description
    description: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
