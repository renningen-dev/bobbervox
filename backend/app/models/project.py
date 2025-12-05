from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.segment import Segment


class Project(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "projects"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    source_video: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    extracted_audio: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    segments: Mapped[list[Segment]] = relationship(
        "Segment",
        back_populates="project",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
