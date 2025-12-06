from __future__ import annotations

import logging
import uuid
from pathlib import Path
from typing import Optional

import aiofiles
import httpx

from app.utils.exceptions import ExternalAPIError, ProcessingError

logger = logging.getLogger(__name__)


class ChatterBoxService:
    """Service for ChatterBox TTS API interactions."""

    def __init__(
        self,
        base_url: str,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self._client: Optional[httpx.AsyncClient] = None

    @property
    def client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=120.0)  # 2 min timeout for TTS
        return self._client

    async def close(self) -> None:
        """Close the HTTP client."""
        if self._client:
            await self._client.aclose()
            self._client = None

    async def upload_reference_audio(self, file_path: str, filename: str) -> str:
        """Upload a reference audio file to ChatterBox server.

        Args:
            file_path: Absolute path to the audio file
            filename: Filename to use on the server

        Returns:
            The filename as stored on the server
        """
        source_path = Path(file_path)
        if not source_path.exists():
            raise ProcessingError(f"Audio file not found: {file_path}")

        try:
            async with aiofiles.open(source_path, "rb") as f:
                file_content = await f.read()

            response = await self.client.post(
                f"{self.base_url}/upload_reference",
                files={"files": (filename, file_content, "audio/wav")},
            )
            response.raise_for_status()

            result = response.json()
            uploaded_files = result.get("uploaded_files", [])
            if filename in uploaded_files:
                logger.info(f"Uploaded reference audio to ChatterBox: {filename}")
                return filename
            else:
                # Check if file already exists (skipped as duplicate)
                all_files = result.get("all_reference_files", [])
                if filename in all_files:
                    logger.info(f"Reference audio already exists on ChatterBox: {filename}")
                    return filename

                errors = result.get("errors", [])
                error_msg = errors[0].get("error") if errors else "Unknown error"
                raise ExternalAPIError(f"Failed to upload reference audio: {error_msg}")

        except httpx.HTTPStatusError as e:
            logger.error(f"ChatterBox upload error: {e.response.status_code} - {e.response.text}")
            raise ExternalAPIError(f"ChatterBox upload failed: {e.response.text}") from e
        except httpx.RequestError as e:
            logger.error(f"ChatterBox connection error during upload: {e}")
            raise ExternalAPIError(
                f"Failed to connect to ChatterBox server at {self.base_url}. "
                "Is the server running?"
            ) from e

    async def generate_tts(
        self,
        text: str,
        voice: str = "Emily.wav",
        output_path: Optional[Path] = None,
        speed: float = 1.0,
        custom_voice_path: Optional[str] = None,
        temperature: Optional[float] = None,
        exaggeration: Optional[float] = None,
        cfg_weight: Optional[float] = None,
    ) -> Path:
        """Generate TTS audio using ChatterBox server.

        Uses the custom /tts endpoint when ChatterBox params are provided,
        otherwise falls back to the OpenAI-compatible /v1/audio/speech endpoint.

        Args:
            text: The text to convert to speech
            voice: Voice file to use (e.g., "Emily.wav")
            output_path: Where to save the output file
            speed: Speed factor (1.0 = normal)
            custom_voice_path: Absolute path to custom voice file (for voice cloning)
            temperature: Controls randomness (0.1-1.0)
            exaggeration: Controls emotion intensity (0.0-1.0)
            cfg_weight: Classifier-free guidance weight (0.0-1.0)

        Returns:
            Path to the generated audio file
        """
        if not text.strip():
            raise ProcessingError("Text cannot be empty")

        if output_path is None:
            raise ProcessingError("Output path must be specified")

        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Handle custom voice by uploading to ChatterBox via API
        voice_to_use = voice
        use_clone_mode = False

        if custom_voice_path:
            # Create unique filename to avoid conflicts
            unique_name = f"bobbervox_custom_{uuid.uuid4().hex}.wav"

            # Upload the custom voice via ChatterBox API
            await self.upload_reference_audio(custom_voice_path, unique_name)
            voice_to_use = unique_name
            use_clone_mode = True
        else:
            # ChatterBox expects voice as filename (with or without extension)
            # Ensure it has .wav extension for predefined voices
            if not voice.endswith((".wav", ".mp3")) and not voice.startswith("custom:"):
                voice_to_use = f"{voice}.wav"

        # Use custom /tts endpoint if ChatterBox params are provided
        use_custom_endpoint = any(p is not None for p in [temperature, exaggeration, cfg_weight])

        try:
            if use_custom_endpoint:
                # Use the full-featured /tts endpoint
                request_data = {
                    "text": text,
                    "voice_mode": "clone" if use_clone_mode else "predefined",
                    "output_format": "wav",
                    "speed_factor": speed,
                }

                if use_clone_mode:
                    request_data["reference_audio_filename"] = voice_to_use
                else:
                    request_data["predefined_voice_id"] = voice_to_use

                # Add ChatterBox-specific parameters
                if temperature is not None:
                    request_data["temperature"] = temperature
                if exaggeration is not None:
                    request_data["exaggeration"] = exaggeration
                if cfg_weight is not None:
                    request_data["cfg_weight"] = cfg_weight

                logger.info(f"ChatterBox /tts request: {request_data}")
                response = await self.client.post(
                    f"{self.base_url}/tts",
                    json=request_data,
                )
            else:
                # Use OpenAI-compatible endpoint for simple requests
                response = await self.client.post(
                    f"{self.base_url}/v1/audio/speech",
                    json={
                        "model": "chatterbox",
                        "input": text,
                        "voice": voice_to_use,
                        "response_format": "wav",
                        "speed": speed,
                    },
                )
            response.raise_for_status()
        except httpx.HTTPStatusError as e:
            logger.error(f"ChatterBox API error: {e.response.status_code} - {e.response.text}")
            raise ExternalAPIError(f"ChatterBox TTS failed: {e.response.text}") from e
        except httpx.RequestError as e:
            logger.error(f"ChatterBox connection error: {e}")
            raise ExternalAPIError(
                f"Failed to connect to ChatterBox server at {self.base_url}. "
                "Is the server running?"
            ) from e

        # Write the audio to file (ChatterBox returns WAV)
        # Convert to MP3 path if needed for consistency with OpenAI output
        if output_path.suffix.lower() == ".mp3":
            # Save as WAV with same name
            wav_path = output_path.with_suffix(".wav")
            wav_path.write_bytes(response.content)
            return wav_path
        else:
            output_path.write_bytes(response.content)
            return output_path

    async def check_health(self) -> bool:
        """Check if ChatterBox server is healthy."""
        try:
            # Use short timeout for health checks
            async with httpx.AsyncClient(timeout=3.0) as client:
                response = await client.get(f"{self.base_url}/docs")
                return response.status_code == 200
        except Exception:
            return False

    @staticmethod
    def format_tts_filename(start_time: float) -> str:
        """Format TTS output filename from timestamp.

        Format: tts_{MM}m{SS}s{mmm}ms.wav
        Note: ChatterBox outputs WAV, not MP3
        """
        total_seconds = int(start_time)
        minutes = total_seconds // 60
        seconds = total_seconds % 60
        milliseconds = int((start_time - total_seconds) * 1000)
        return f"tts_{minutes:02d}m{seconds:02d}s{milliseconds:03d}ms.wav"
