from typing import Literal, Optional

from pydantic import BaseModel

# TTS provider types
TTSProviderType = Literal["openai", "chatterbox"]


class SettingsResponse(BaseModel):
    """Response model for app settings."""

    openai_api_key: str
    openai_api_key_set: bool  # Whether the key is set (without revealing it)
    context_description: str
    tts_provider: TTSProviderType
    chatterbox_available: bool = False  # Whether ChatterBox server is reachable

    model_config = {"from_attributes": True}


class ChatterBoxHealthResponse(BaseModel):
    """Response model for ChatterBox health check."""

    available: bool
    url: str


class SettingsUpdate(BaseModel):
    """Request model for updating settings."""

    openai_api_key: Optional[str] = None
    context_description: Optional[str] = None
    tts_provider: Optional[TTSProviderType] = None
