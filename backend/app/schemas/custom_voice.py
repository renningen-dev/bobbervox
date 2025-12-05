from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class CustomVoiceCreate(BaseModel):
    name: str
    description: Optional[str] = None


class CustomVoiceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    file_path: str
    description: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]


class CustomVoiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
