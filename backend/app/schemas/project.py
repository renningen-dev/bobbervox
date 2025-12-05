from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from pydantic import BaseModel, ConfigDict

if TYPE_CHECKING:
    pass


class ProjectCreate(BaseModel):
    name: str


class ProjectRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    created_at: datetime
    updated_at: Optional[datetime]
    source_video: Optional[str]
    extracted_audio: Optional[str]


class ProjectList(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    created_at: datetime
    source_video: Optional[str]
    extracted_audio: Optional[str]
    segment_count: int = 0


# Import SegmentRead here to avoid circular import
from app.schemas.segment import SegmentRead  # noqa: E402


class ProjectReadWithSegments(ProjectRead):
    segments: list[SegmentRead] = []
