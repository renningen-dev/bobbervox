from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, field_validator

from app.models.segment import SegmentStatus


class AnalysisResult(BaseModel):
    translated_text: str
    tone: Optional[str] = None
    emotion: Optional[str] = None
    style: Optional[str] = None
    pace: Optional[str] = None
    intonation: Optional[str] = None
    voice: Optional[str] = None
    tempo: Optional[str] = None
    emphasis: list[str] = []
    pause_before: list[str] = []


class SegmentCreate(BaseModel):
    start_time: float
    end_time: float

    @field_validator("end_time")
    @classmethod
    def end_time_greater_than_start(cls, v: float, info: Any) -> float:
        start = info.data.get("start_time")
        if start is not None and v <= start:
            raise ValueError("end_time must be greater than start_time")
        return v


class SegmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    start_time: float
    end_time: float
    audio_file: Optional[str]
    original_transcription: Optional[str]
    translated_text: Optional[str]
    analysis_json: Optional[dict[str, Any]]
    tts_voice: Optional[str]
    tts_result_file: Optional[str]
    status: SegmentStatus
    error_message: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]


class SegmentUpdateTranslation(BaseModel):
    translated_text: str


class SegmentUpdateAnalysis(BaseModel):
    tone: Optional[str] = None
    emotion: Optional[str] = None
    style: Optional[str] = None
    pace: Optional[str] = None
    intonation: Optional[str] = None
    voice: Optional[str] = None
    tempo: Optional[str] = None
    emphasis: list[str] = []
    pause_before: list[str] = []


OPENAI_TTS_VOICES = [
    "alloy",
    "ash",
    "ballad",
    "cedar",
    "coral",
    "echo",
    "fable",
    "marin",
    "nova",
    "onyx",
    "sage",
    "shimmer",
    "verse",
]

CHATTERBOX_TTS_VOICES = [
    "Abigail.wav",
    "Adrian.wav",
    "Alexander.wav",
    "Alice.wav",
    "Austin.wav",
    "Axel.wav",
    "Connor.wav",
    "Cora.wav",
    "Elena.wav",
    "Eli.wav",
    "Emily.wav",
    "Everett.wav",
    "Gabriel.wav",
    "Gianna.wav",
    "Henry.wav",
    "Ian.wav",
    "Jade.wav",
    "Jeremiah.wav",
    "Jordan.wav",
    "Julian.wav",
    "Layla.wav",
    "Leonardo.wav",
    "Michael.wav",
    "Miles.wav",
    "Olivia.wav",
    "Ryan.wav",
    "Taylor.wav",
    "Thomas.wav",
]

# Combined list for validation
ALL_TTS_VOICES = OPENAI_TTS_VOICES + CHATTERBOX_TTS_VOICES


class TTSRequest(BaseModel):
    voice: str = "alloy"
    # Analysis fields for TTS instructions
    tone: Optional[str] = None
    emotion: Optional[str] = None
    style: Optional[str] = None
    pace: Optional[str] = None
    intonation: Optional[str] = None
    tempo: Optional[str] = None
    emphasis: list[str] = []
    pause_before: list[str] = []
    # Target language for TTS
    target_language: Optional[str] = None

    @field_validator("voice")
    @classmethod
    def validate_voice(cls, v: str) -> str:
        # Allow custom voices (format: custom:id:name)
        if v.startswith("custom:"):
            return v
        if v not in ALL_TTS_VOICES:
            raise ValueError(f"Invalid voice. Must be one of: {ALL_TTS_VOICES}")
        return v

    def build_instructions(self) -> str:
        """Build TTS instructions from analysis fields."""
        parts = []

        if self.target_language:
            parts.append(f"Speak in {self.target_language}.")

        if self.tone:
            parts.append(f"Tone: {self.tone}.")
        if self.emotion:
            parts.append(f"Emotion: {self.emotion}.")
        if self.style:
            parts.append(f"Style: {self.style}.")
        if self.pace:
            parts.append(f"Pace: {self.pace}.")
        if self.intonation:
            parts.append(f"Intonation: {self.intonation}.")
        if self.tempo:
            parts.append(f"Tempo: {self.tempo}.")
        if self.emphasis:
            parts.append(f"Emphasize these words: {', '.join(self.emphasis)}.")
        if self.pause_before:
            parts.append(f"Pause before these words: {', '.join(self.pause_before)}.")

        return " ".join(parts) if parts else ""
