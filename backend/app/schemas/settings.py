from typing import Optional

from pydantic import BaseModel


class SettingsResponse(BaseModel):
    """Response model for app settings."""

    openai_api_key: str
    openai_api_key_set: bool  # Whether the key is set (without revealing it)
    context_description: str

    model_config = {"from_attributes": True}


class SettingsUpdate(BaseModel):
    """Request model for updating settings."""

    openai_api_key: Optional[str] = None
    context_description: Optional[str] = None
