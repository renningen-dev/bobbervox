import json
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.config import Settings
from app.services.openai_service import TTS_VOICES, OpenAIService
from app.utils.exceptions import ExternalAPIError, ProcessingError


@pytest.fixture
def openai_service(tmp_path: Path) -> OpenAIService:
    settings = Settings(projects_dir=tmp_path, openai_api_key="test-key")
    return OpenAIService(settings)


@pytest.fixture
def sample_audio(tmp_path: Path) -> Path:
    """Create a sample audio file for testing."""
    audio_path = tmp_path / "test_audio.wav"
    # Just some bytes to simulate audio
    audio_path.write_bytes(b"RIFF" + b"\x00" * 100)
    return audio_path


class TestOpenAIService:
    def test_no_api_key_warning(self, tmp_path: Path):
        settings = Settings(projects_dir=tmp_path, openai_api_key="")
        service = OpenAIService(settings)
        # Should not raise, just log warning
        assert service._client is None

    def test_client_raises_without_api_key(self, tmp_path: Path):
        settings = Settings(projects_dir=tmp_path, openai_api_key="")
        service = OpenAIService(settings)
        with pytest.raises(ProcessingError, match="OpenAI API key not configured"):
            _ = service.client

    @pytest.mark.asyncio
    async def test_analyze_audio_file_not_found(
        self, openai_service: OpenAIService, tmp_path: Path
    ):
        nonexistent = tmp_path / "nonexistent.wav"
        with pytest.raises(ProcessingError, match="Audio file not found"):
            await openai_service.analyze_audio(nonexistent)

    @pytest.mark.asyncio
    async def test_analyze_audio_unsupported_format(
        self, openai_service: OpenAIService, tmp_path: Path
    ):
        audio_path = tmp_path / "test.ogg"
        audio_path.write_bytes(b"some data")
        with pytest.raises(ProcessingError, match="Unsupported audio format"):
            await openai_service.analyze_audio(audio_path)

    @pytest.mark.asyncio
    async def test_analyze_audio_success(self, openai_service: OpenAIService, sample_audio: Path):
        mock_response = MagicMock()
        mock_response.choices = [
            MagicMock(
                message=MagicMock(
                    content=json.dumps(
                        {
                            "transcription": "Hello world",
                            "translated_text": "Hello world",
                            "tone": "neutral",
                            "emotion": "calm",
                            "style": "conversational",
                            "pace": "moderate",
                            "intonation": "even",
                            "voice": "male",
                            "tempo": "steady",
                            "emphasis": [],
                            "pause_before": [],
                        }
                    )
                )
            )
        ]

        with patch.object(openai_service, "_client", new_callable=MagicMock) as mock_client:
            mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

            result = await openai_service.analyze_audio(sample_audio)

            assert result["transcription"] == "Hello world"
            assert result["translated_text"] == "Hello world"
            assert result["tone"] == "neutral"

    @pytest.mark.asyncio
    async def test_analyze_audio_with_code_block_response(
        self, openai_service: OpenAIService, sample_audio: Path
    ):
        """Test parsing response wrapped in markdown code blocks."""
        mock_response = MagicMock()
        mock_response.choices = [
            MagicMock(
                message=MagicMock(
                    content='```json\n{"transcription": "test", "translated_text": "test"}\n```'
                )
            )
        ]

        with patch.object(openai_service, "_client", new_callable=MagicMock) as mock_client:
            mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

            result = await openai_service.analyze_audio(sample_audio)

            assert result["transcription"] == "test"

    @pytest.mark.asyncio
    async def test_analyze_audio_empty_response(
        self, openai_service: OpenAIService, sample_audio: Path
    ):
        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content=None))]

        with patch.object(openai_service, "_client", new_callable=MagicMock) as mock_client:
            mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

            with pytest.raises(ExternalAPIError, match="Empty response"):
                await openai_service.analyze_audio(sample_audio)

    @pytest.mark.asyncio
    async def test_analyze_audio_invalid_json(
        self, openai_service: OpenAIService, sample_audio: Path
    ):
        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content="not valid json"))]

        with patch.object(openai_service, "_client", new_callable=MagicMock) as mock_client:
            mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

            with pytest.raises(ExternalAPIError, match="Failed to parse"):
                await openai_service.analyze_audio(sample_audio)

    @pytest.mark.asyncio
    async def test_generate_tts_empty_text(self, openai_service: OpenAIService, tmp_path: Path):
        with pytest.raises(ProcessingError, match="Text cannot be empty"):
            await openai_service.generate_tts("   ", output_path=tmp_path / "out.mp3")

    @pytest.mark.asyncio
    async def test_generate_tts_invalid_voice(self, openai_service: OpenAIService, tmp_path: Path):
        with pytest.raises(ProcessingError, match="Invalid voice"):
            await openai_service.generate_tts(
                "Hello", voice="invalid", output_path=tmp_path / "out.mp3"
            )

    @pytest.mark.asyncio
    async def test_generate_tts_no_output_path(self, openai_service: OpenAIService):
        with pytest.raises(ProcessingError, match="Output path must be specified"):
            await openai_service.generate_tts("Hello")

    @pytest.mark.asyncio
    async def test_generate_tts_success(self, openai_service: OpenAIService, tmp_path: Path):
        output_path = tmp_path / "output" / "tts.mp3"
        mock_response = MagicMock()
        mock_response.content = b"fake mp3 data"

        with patch.object(openai_service, "_client", new_callable=MagicMock) as mock_client:
            mock_client.audio.speech.create = AsyncMock(return_value=mock_response)

            result = await openai_service.generate_tts(
                "Hello world", voice="alloy", output_path=output_path
            )

            assert result == output_path
            assert output_path.exists()
            assert output_path.read_bytes() == b"fake mp3 data"

    @pytest.mark.asyncio
    async def test_generate_tts_all_voices(self, openai_service: OpenAIService, tmp_path: Path):
        """Test that all valid voices are accepted."""
        for voice in TTS_VOICES:
            output_path = tmp_path / f"{voice}.mp3"
            mock_response = MagicMock()
            mock_response.content = b"audio"

            with patch.object(openai_service, "_client", new_callable=MagicMock) as mock_client:
                mock_client.audio.speech.create = AsyncMock(return_value=mock_response)

                result = await openai_service.generate_tts(
                    "Test", voice=voice, output_path=output_path
                )

                assert result == output_path


class TestTTSFilenameFormat:
    def test_format_zero(self):
        filename = OpenAIService.format_tts_filename(0.0)
        assert filename == "tts_00m00s000ms.mp3"

    def test_format_with_seconds(self):
        filename = OpenAIService.format_tts_filename(15.32)
        assert filename == "tts_00m15s320ms.mp3"

    def test_format_with_minutes(self):
        filename = OpenAIService.format_tts_filename(125.5)
        assert filename == "tts_02m05s500ms.mp3"
