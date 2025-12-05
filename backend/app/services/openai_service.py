from __future__ import annotations

import base64
import json
import logging
from pathlib import Path
from typing import Any, Optional

from openai import AsyncOpenAI

from app.config import Settings
from app.utils.exceptions import ExternalAPIError, ProcessingError

logger = logging.getLogger(__name__)

# Available TTS voices
TTS_VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]

AUDIO_ANALYSIS_SYSTEM_PROMPT = """You are an audio analysis assistant specialized in outdoor/rural environments.
The audio is from a fishing video. Your task is to:

1. Transcribe the uploaded audio accurately.
2. Translate the text into English.
3. Analyze the speaker's delivery and describe:
   - Tone
   - Emotion
   - Speaking style (including hints for casual, outdoor, relaxed, or energetic context)
   - Pace, rhythm, and intonation
   - Volume, emphasis, and natural pauses"""

AUDIO_ANALYSIS_USER_PROMPT = """Output everything in JSON format exactly like this:
{ "transcription": "...", "translated_text": "...", "tone": "...", "emotion": "...", "style": "...", "pace": "...", "intonation": "...", "voice": "...", "tempo": "...", "emphasis": [...], "pause_before": [...] }"""


class OpenAIService:
    """Service for OpenAI API interactions - audio analysis and TTS."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        if not settings.openai_api_key:
            logger.warning("OpenAI API key not configured")
        self._client: Optional[AsyncOpenAI] = None

    @property
    def client(self) -> AsyncOpenAI:
        if self._client is None:
            if not self.settings.openai_api_key:
                raise ProcessingError("OpenAI API key not configured")
            self._client = AsyncOpenAI(api_key=self.settings.openai_api_key)
        return self._client

    async def analyze_audio(self, audio_path: Path) -> dict[str, Any]:
        """Analyze audio using gpt-4o-audio-preview.

        Args:
            audio_path: Path to the audio file (WAV or MP3)

        Returns:
            Analysis result with transcription, translation, and voice characteristics
        """
        if not audio_path.exists():
            raise ProcessingError(f"Audio file not found: {audio_path}")

        # Read and base64 encode the audio
        audio_bytes = audio_path.read_bytes()
        audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")

        # Validate audio format
        suffix = audio_path.suffix.lower()
        if suffix not in (".wav", ".mp3"):
            raise ProcessingError(f"Unsupported audio format: {suffix}")

        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o-audio-preview",
                modalities=["text"],
                messages=[
                    {"role": "system", "content": AUDIO_ANALYSIS_SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "input_audio",
                                "input_audio": {
                                    "data": audio_base64,
                                    "format": suffix.lstrip("."),
                                },
                            },
                            {"type": "text", "text": AUDIO_ANALYSIS_USER_PROMPT},
                        ],
                    },
                ],
            )
        except Exception as e:
            logger.error(f"OpenAI API error during audio analysis: {e}")
            raise ExternalAPIError(f"Failed to analyze audio: {str(e)}") from e

        # Parse the response
        content = response.choices[0].message.content
        logger.info(f"OpenAI response content: {content!r}")

        if not content or not content.strip():
            raise ExternalAPIError("Empty response from OpenAI API")

        try:
            # Try to extract JSON from the response
            # The model might return markdown code blocks
            if "```json" in content:
                json_str = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                json_str = content.split("```")[1].split("```")[0].strip()
            else:
                json_str = content.strip()

            logger.info(f"Parsing JSON: {json_str!r}")
            result = json.loads(json_str)
        except (json.JSONDecodeError, IndexError) as e:
            logger.error(f"Failed to parse OpenAI response: {content!r}")
            raise ExternalAPIError(f"Failed to parse analysis response: {str(e)}") from e

        return result

    async def generate_tts(
        self,
        text: str,
        voice: str = "alloy",
        output_path: Optional[Path] = None,
    ) -> Path:
        """Generate TTS audio using OpenAI tts-1-hd.

        Args:
            text: The text to convert to speech
            voice: Voice to use (alloy, echo, fable, onyx, nova, shimmer)
            output_path: Where to save the output file

        Returns:
            Path to the generated MP3 file
        """
        if not text.strip():
            raise ProcessingError("Text cannot be empty")

        if voice not in TTS_VOICES:
            raise ProcessingError(f"Invalid voice '{voice}'. Valid options: {TTS_VOICES}")

        if output_path is None:
            raise ProcessingError("Output path must be specified")

        output_path.parent.mkdir(parents=True, exist_ok=True)

        try:
            response = await self.client.audio.speech.create(
                model="tts-1-hd",
                voice=voice,
                input=text,
                response_format="mp3",
            )
        except Exception as e:
            logger.error(f"OpenAI API error during TTS generation: {e}")
            raise ExternalAPIError(f"Failed to generate TTS: {str(e)}") from e

        # Write the audio to file
        output_path.write_bytes(response.content)

        return output_path

    @staticmethod
    def format_tts_filename(start_time: float) -> str:
        """Format TTS output filename from timestamp.

        Format: tts_{MM}m{SS}s{mmm}ms.mp3
        """
        total_seconds = int(start_time)
        minutes = total_seconds // 60
        seconds = total_seconds % 60
        milliseconds = int((start_time - total_seconds) * 1000)
        return f"tts_{minutes:02d}m{seconds:02d}s{milliseconds:03d}ms.mp3"
