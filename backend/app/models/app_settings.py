from __future__ import annotations

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.base import TimestampMixin

DEFAULT_CONTEXT = """The audio is from outdoor/rural environments, specifically fishing videos.
The speaker uses casual, relaxed language typical of outdoor content creators."""


class UserSettings(TimestampMixin, Base):
    """Per-user settings stored in database."""

    __tablename__ = "user_settings"

    user_id: Mapped[str] = mapped_column(String(128), primary_key=True)

    # OpenAI settings
    openai_api_key: Mapped[str] = mapped_column(Text, default="", nullable=False)

    # Context description for analysis (user-editable)
    context_description: Mapped[str] = mapped_column(Text, default=DEFAULT_CONTEXT, nullable=False)


# Keep AppSettings for backwards compatibility during migration
class AppSettings(TimestampMixin, Base):
    """Application settings stored in database (deprecated, use UserSettings)."""

    __tablename__ = "app_settings"

    id: Mapped[int] = mapped_column(primary_key=True, default=1)

    # OpenAI settings
    openai_api_key: Mapped[str] = mapped_column(Text, default="", nullable=False)

    # Context description for analysis (user-editable)
    context_description: Mapped[str] = mapped_column(Text, default=DEFAULT_CONTEXT, nullable=False)
