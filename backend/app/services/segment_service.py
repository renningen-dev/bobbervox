from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING, Optional

from app.config import Settings
from app.models import Segment
from app.models.segment import SegmentStatus
from app.repositories.segment_repo import SegmentRepository
from app.services.ffmpeg_service import FFmpegService
from app.services.openai_service import OpenAIService
from app.utils.exceptions import ProcessingError, SegmentNotFoundError

if TYPE_CHECKING:
    from app.models import Project


class SegmentService:
    def __init__(
        self,
        repo: SegmentRepository,
        ffmpeg: FFmpegService,
        settings: Settings,
        openai: Optional[OpenAIService] = None,
    ) -> None:
        self.repo = repo
        self.ffmpeg = ffmpeg
        self.settings = settings
        self.openai = openai

    def _get_project_audio_path(self, project: Project) -> Path:
        """Get full audio path from project."""
        if not project.extracted_audio:
            raise ProcessingError("Project has no extracted audio")
        return self.settings.projects_dir / project.extracted_audio

    def _get_segments_dir(self, project_id: str) -> Path:
        return self.settings.projects_dir / project_id / "segments"

    async def create(
        self,
        project: Project,
        start_time: float,
        end_time: float,
    ) -> Segment:
        """Create a segment and schedule audio extraction."""
        segment = await self.repo.create(
            project_id=project.id,
            start_time=start_time,
            end_time=end_time,
        )
        return segment

    async def get_by_id(self, segment_id: str) -> Segment:
        segment = await self.repo.get_by_id(segment_id)
        if not segment:
            raise SegmentNotFoundError(segment_id)
        return segment

    async def list_by_project(self, project_id: str) -> list[Segment]:
        return await self.repo.list_by_project(project_id)

    async def delete(self, segment_id: str) -> None:
        segment = await self.get_by_id(segment_id)

        # Delete audio file if exists
        if segment.audio_file:
            audio_path = self.settings.projects_dir / segment.audio_file
            if audio_path.exists():
                audio_path.unlink()

        # Delete TTS result if exists
        if segment.tts_result_file:
            tts_path = self.settings.projects_dir / segment.tts_result_file
            if tts_path.exists():
                tts_path.unlink()

        await self.repo.delete(segment)

    async def extract_audio(self, segment: Segment, project: Project) -> Segment:
        """Extract audio segment from project audio."""
        audio_path = self._get_project_audio_path(project)
        segments_dir = self._get_segments_dir(project.id)

        filename = self.ffmpeg.format_segment_filename(segment.start_time)
        output_path = segments_dir / filename

        # Update status to extracting
        segment = await self.repo.update(segment, status=SegmentStatus.EXTRACTING)

        try:
            await self.ffmpeg.extract_segment(
                audio_path=audio_path,
                output_path=output_path,
                start_time=segment.start_time,
                end_time=segment.end_time,
            )

            relative_path = str(output_path.relative_to(self.settings.projects_dir))
            segment = await self.repo.update(
                segment,
                audio_file=relative_path,
                status=SegmentStatus.EXTRACTED,
            )
        except Exception as e:
            segment = await self.repo.update(
                segment,
                status=SegmentStatus.ERROR,
                error_message=str(e),
            )
            raise

        return segment

    async def update_translation(self, segment_id: str, translated_text: str) -> Segment:
        segment = await self.get_by_id(segment_id)
        return await self.repo.update(segment, translated_text=translated_text)

    async def update_analysis(self, segment_id: str, analysis_updates: dict) -> Segment:
        segment = await self.get_by_id(segment_id)
        # Merge with existing analysis instead of replacing
        existing_analysis = segment.analysis_json or {}
        merged_analysis = {**existing_analysis, **analysis_updates}
        return await self.repo.update(
            segment,
            analysis_json=merged_analysis,
            original_transcription=merged_analysis.get("transcription"),
        )

    def _get_output_dir(self, project_id: str) -> Path:
        return self.settings.projects_dir / project_id / "output"

    async def analyze_segment(
        self,
        segment: Segment,
        openai: Optional[OpenAIService] = None,
    ) -> Segment:
        """Analyze segment audio using OpenAI."""
        openai_service = openai or self.openai
        if openai_service is None:
            raise ProcessingError("OpenAI service not configured")

        if not segment.audio_file:
            raise ProcessingError("Segment has no audio file. Extract audio first.")

        audio_path = self.settings.projects_dir / segment.audio_file

        # Update status to analyzing
        segment = await self.repo.update(segment, status=SegmentStatus.ANALYZING)

        try:
            analysis = await openai_service.analyze_audio(audio_path)

            segment = await self.repo.update(
                segment,
                status=SegmentStatus.ANALYZED,
                analysis_json=analysis,
                original_transcription=analysis.get("transcription"),
                translated_text=analysis.get("translated_text"),
            )
        except Exception as e:
            segment = await self.repo.update(
                segment,
                status=SegmentStatus.ERROR,
                error_message=str(e),
            )
            # Commit error status before raising so it persists
            await self.repo.commit()
            raise

        return segment

    async def generate_tts(
        self,
        segment: Segment,
        voice: str = "alloy",
        instructions: Optional[str] = None,
        openai: Optional[OpenAIService] = None,
    ) -> Segment:
        """Generate TTS audio for segment."""
        openai_service = openai or self.openai
        if openai_service is None:
            raise ProcessingError("OpenAI service not configured")

        if not segment.translated_text:
            raise ProcessingError(
                "Segment has no translated text. Analyze or add translation first."
            )

        output_dir = self._get_output_dir(segment.project_id)
        filename = OpenAIService.format_tts_filename(segment.start_time)
        output_path = output_dir / filename

        # Update status to generating
        segment = await self.repo.update(
            segment,
            status=SegmentStatus.GENERATING_TTS,
            tts_voice=voice,
        )

        try:
            await openai_service.generate_tts(
                text=segment.translated_text,
                voice=voice,
                output_path=output_path,
                instructions=instructions,
            )

            relative_path = str(output_path.relative_to(self.settings.projects_dir))
            segment = await self.repo.update(
                segment,
                status=SegmentStatus.COMPLETED,
                tts_result_file=relative_path,
            )
        except Exception as e:
            segment = await self.repo.update(
                segment,
                status=SegmentStatus.ERROR,
                error_message=str(e),
            )
            raise

        return segment
