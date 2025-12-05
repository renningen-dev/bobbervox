from __future__ import annotations

import enum
from typing import TYPE_CHECKING, Any, Optional

from sqlalchemy import JSON, Enum, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.project import Project


class SegmentStatus(str, enum.Enum):
    CREATED = "created"
    EXTRACTING = "extracting"
    EXTRACTED = "extracted"
    ANALYZING = "analyzing"
    ANALYZED = "analyzed"
    GENERATING_TTS = "generating_tts"
    COMPLETED = "completed"
    ERROR = "error"


class Segment(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "segments"

    project_id: Mapped[str] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )
    start_time: Mapped[float] = mapped_column(Float, nullable=False)
    end_time: Mapped[float] = mapped_column(Float, nullable=False)
    audio_file: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    original_transcription: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    translated_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    analysis_json: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)
    tts_voice: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    tts_result_file: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    status: Mapped[SegmentStatus] = mapped_column(
        Enum(SegmentStatus),
        default=SegmentStatus.CREATED,
        nullable=False,
    )
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    project: Mapped[Project] = relationship("Project", back_populates="segments")
