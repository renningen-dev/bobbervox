from __future__ import annotations

import asyncio
import logging
from pathlib import Path

from app.config import Settings
from app.utils.exceptions import ProcessingError

logger = logging.getLogger(__name__)


class FFmpegService:
    """Service for FFmpeg audio operations using async subprocess."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    async def _run_ffmpeg(self, args: list[str]) -> None:
        """Run FFmpeg command asynchronously."""
        cmd = ["ffmpeg", "-y", *args]
        logger.debug(f"Running FFmpeg: {' '.join(cmd)}")

        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        stdout, stderr = await process.communicate()

        if process.returncode != 0:
            error_msg = stderr.decode() if stderr else "Unknown FFmpeg error"
            logger.error(f"FFmpeg failed: {error_msg}")
            raise ProcessingError(f"FFmpeg processing failed: {error_msg[:500]}")

    async def extract_audio(self, video_path: Path, output_path: Path) -> Path:
        """Extract audio from video file as WAV.

        Args:
            video_path: Path to source video file
            output_path: Path where WAV file will be written

        Returns:
            Path to extracted audio file
        """
        if not video_path.exists():
            raise ProcessingError(f"Video file not found: {video_path}")

        output_path.parent.mkdir(parents=True, exist_ok=True)

        args = [
            "-i",
            str(video_path),
            "-vn",  # No video
            "-acodec",
            "pcm_s16le",  # 16-bit PCM
            "-ar",
            "44100",  # 44.1kHz sample rate
            "-ac",
            "2",  # Stereo
            str(output_path),
        ]

        await self._run_ffmpeg(args)
        return output_path

    async def extract_segment(
        self,
        audio_path: Path,
        output_path: Path,
        start_time: float,
        end_time: float,
    ) -> Path:
        """Extract a segment from audio file.

        Args:
            audio_path: Path to source audio file
            output_path: Path where segment will be written
            start_time: Start time in seconds
            end_time: End time in seconds

        Returns:
            Path to extracted segment file
        """
        if not audio_path.exists():
            raise ProcessingError(f"Audio file not found: {audio_path}")

        if start_time < 0:
            raise ProcessingError("Start time cannot be negative")
        if end_time <= start_time:
            raise ProcessingError("End time must be greater than start time")

        output_path.parent.mkdir(parents=True, exist_ok=True)
        duration = end_time - start_time

        args = [
            "-i",
            str(audio_path),
            "-ss",
            str(start_time),
            "-t",
            str(duration),
            "-acodec",
            "pcm_s16le",
            "-ar",
            "44100",
            "-ac",
            "2",
            str(output_path),
        ]

        await self._run_ffmpeg(args)
        return output_path

    @staticmethod
    def format_segment_filename(start_time: float) -> str:
        """Format segment filename from timestamp.

        Format: segment_{MM}m{SS}s{mmm}ms.wav
        Example: 15.32 seconds → segment_00m15s320ms.wav
        """
        total_seconds = int(start_time)
        minutes = total_seconds // 60
        seconds = total_seconds % 60
        milliseconds = int((start_time - total_seconds) * 1000)
        return f"segment_{minutes:02d}m{seconds:02d}s{milliseconds:03d}ms.wav"

    async def get_audio_duration(self, audio_path: Path) -> float:
        """Get duration of audio file in seconds."""
        if not audio_path.exists():
            raise ProcessingError(f"Audio file not found: {audio_path}")

        cmd = [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(audio_path),
        ]

        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        stdout, stderr = await process.communicate()

        if process.returncode != 0:
            error_msg = stderr.decode() if stderr else "Unknown ffprobe error"
            raise ProcessingError(f"Could not get audio duration: {error_msg}")

        try:
            return float(stdout.decode().strip())
        except ValueError as e:
            raise ProcessingError("Could not parse audio duration") from e
