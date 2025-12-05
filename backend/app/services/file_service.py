from __future__ import annotations

import shutil
from pathlib import Path
from typing import BinaryIO

import aiofiles

from app.config import Settings
from app.utils.exceptions import FileValidationError


class FileService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def get_project_path(self, project_id: str) -> Path:
        return self.settings.projects_dir / project_id

    def get_source_path(self, project_id: str) -> Path:
        return self.get_project_path(project_id) / "source"

    def get_audio_path(self, project_id: str) -> Path:
        return self.get_project_path(project_id) / "audio"

    def get_segments_path(self, project_id: str) -> Path:
        return self.get_project_path(project_id) / "segments"

    def get_output_path(self, project_id: str) -> Path:
        return self.get_project_path(project_id) / "output"

    def validate_video_extension(self, filename: str) -> str:
        ext = Path(filename).suffix.lower()
        if ext not in self.settings.allowed_video_extensions:
            allowed = ", ".join(self.settings.allowed_video_extensions)
            raise FileValidationError(f"Invalid file extension '{ext}'. Allowed: {allowed}")
        return ext

    async def save_upload(
        self,
        project_id: str,
        file: BinaryIO,
        filename: str,
    ) -> str:
        ext = self.validate_video_extension(filename)
        source_dir = self.get_source_path(project_id)
        source_dir.mkdir(parents=True, exist_ok=True)

        dest_filename = f"video{ext}"
        dest_path = source_dir / dest_filename

        async with aiofiles.open(dest_path, "wb") as out_file:
            while chunk := file.read(8192):
                await out_file.write(chunk)

        return str(dest_path.relative_to(self.settings.projects_dir))

    def delete_project_files(self, project_id: str) -> None:
        project_path = self.get_project_path(project_id)
        if project_path.exists():
            shutil.rmtree(project_path)

    def get_file_path(
        self,
        project_id: str,
        subdir: str,
        filename: str,
    ) -> Path:
        base_path = self.get_project_path(project_id) / subdir / filename
        if not base_path.exists():
            raise FileValidationError(f"File not found: {filename}")
        if not base_path.is_relative_to(self.get_project_path(project_id)):
            raise FileValidationError("Invalid file path")
        return base_path
