import shutil
import subprocess
from pathlib import Path

import pytest

from app.config import Settings
from app.services.ffmpeg_service import FFmpegService
from app.utils.exceptions import ProcessingError

# Check if ffmpeg is available
FFMPEG_AVAILABLE = shutil.which("ffmpeg") is not None
requires_ffmpeg = pytest.mark.skipif(not FFMPEG_AVAILABLE, reason="FFmpeg not installed")


@pytest.fixture
def ffmpeg_service(tmp_path: Path) -> FFmpegService:
    settings = Settings(projects_dir=tmp_path)
    return FFmpegService(settings)


@pytest.fixture
def sample_audio(tmp_path: Path) -> Path:
    """Generate a short test audio file using FFmpeg."""
    audio_path = tmp_path / "test_audio.wav"
    # Generate 2 seconds of silence as test audio
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-f",
            "lavfi",
            "-i",
            "anullsrc=r=44100:cl=stereo",
            "-t",
            "2",
            "-acodec",
            "pcm_s16le",
            str(audio_path),
        ],
        capture_output=True,
        check=True,
    )
    return audio_path


@pytest.fixture
def sample_video(tmp_path: Path) -> Path:
    """Generate a short test video file using FFmpeg."""
    video_path = tmp_path / "test_video.mp4"
    # Generate 2 seconds of blank video with silent audio
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-f",
            "lavfi",
            "-i",
            "color=c=black:s=320x240:d=2",
            "-f",
            "lavfi",
            "-i",
            "anullsrc=r=44100:cl=stereo",
            "-t",
            "2",
            "-c:v",
            "libx264",
            "-c:a",
            "aac",
            str(video_path),
        ],
        capture_output=True,
        check=True,
    )
    return video_path


@requires_ffmpeg
class TestFFmpegService:
    @pytest.mark.asyncio
    async def test_extract_audio_from_video(
        self,
        ffmpeg_service: FFmpegService,
        sample_video: Path,
        tmp_path: Path,
    ):
        output_path = tmp_path / "output" / "extracted.wav"

        result = await ffmpeg_service.extract_audio(sample_video, output_path)

        assert result == output_path
        assert output_path.exists()
        assert output_path.stat().st_size > 0

    @pytest.mark.asyncio
    async def test_extract_audio_creates_parent_dirs(
        self,
        ffmpeg_service: FFmpegService,
        sample_video: Path,
        tmp_path: Path,
    ):
        output_path = tmp_path / "nested" / "dirs" / "audio.wav"

        await ffmpeg_service.extract_audio(sample_video, output_path)

        assert output_path.exists()

    @pytest.mark.asyncio
    async def test_extract_audio_video_not_found(
        self,
        ffmpeg_service: FFmpegService,
        tmp_path: Path,
    ):
        nonexistent = tmp_path / "nonexistent.mp4"
        output_path = tmp_path / "output.wav"

        with pytest.raises(ProcessingError, match="Video file not found"):
            await ffmpeg_service.extract_audio(nonexistent, output_path)

    @pytest.mark.asyncio
    async def test_extract_segment(
        self,
        ffmpeg_service: FFmpegService,
        sample_audio: Path,
        tmp_path: Path,
    ):
        output_path = tmp_path / "segment.wav"

        result = await ffmpeg_service.extract_segment(
            audio_path=sample_audio,
            output_path=output_path,
            start_time=0.5,
            end_time=1.5,
        )

        assert result == output_path
        assert output_path.exists()

    @pytest.mark.asyncio
    async def test_extract_segment_invalid_times(
        self,
        ffmpeg_service: FFmpegService,
        sample_audio: Path,
        tmp_path: Path,
    ):
        output_path = tmp_path / "segment.wav"

        with pytest.raises(ProcessingError, match="End time must be greater"):
            await ffmpeg_service.extract_segment(
                audio_path=sample_audio,
                output_path=output_path,
                start_time=1.5,
                end_time=0.5,
            )

    @pytest.mark.asyncio
    async def test_extract_segment_negative_start(
        self,
        ffmpeg_service: FFmpegService,
        sample_audio: Path,
        tmp_path: Path,
    ):
        output_path = tmp_path / "segment.wav"

        with pytest.raises(ProcessingError, match="Start time cannot be negative"):
            await ffmpeg_service.extract_segment(
                audio_path=sample_audio,
                output_path=output_path,
                start_time=-1.0,
                end_time=1.0,
            )

    @pytest.mark.asyncio
    async def test_get_audio_duration(
        self,
        ffmpeg_service: FFmpegService,
        sample_audio: Path,
    ):
        duration = await ffmpeg_service.get_audio_duration(sample_audio)

        # Sample audio is 2 seconds
        assert 1.9 < duration < 2.1

    @pytest.mark.asyncio
    async def test_get_audio_duration_file_not_found(
        self,
        ffmpeg_service: FFmpegService,
        tmp_path: Path,
    ):
        nonexistent = tmp_path / "nonexistent.wav"

        with pytest.raises(ProcessingError, match="Audio file not found"):
            await ffmpeg_service.get_audio_duration(nonexistent)


class TestSegmentFilenameFormat:
    def test_format_segment_filename_zero(self):
        filename = FFmpegService.format_segment_filename(0.0)
        assert filename == "segment_00m00s000ms.wav"

    def test_format_segment_filename_seconds_only(self):
        filename = FFmpegService.format_segment_filename(15.0)
        assert filename == "segment_00m15s000ms.wav"

    def test_format_segment_filename_with_milliseconds(self):
        filename = FFmpegService.format_segment_filename(15.32)
        assert filename == "segment_00m15s320ms.wav"

    def test_format_segment_filename_with_minutes(self):
        filename = FFmpegService.format_segment_filename(125.5)
        assert filename == "segment_02m05s500ms.wav"

    def test_format_segment_filename_precise_milliseconds(self):
        filename = FFmpegService.format_segment_filename(0.001)
        assert filename == "segment_00m00s001ms.wav"
