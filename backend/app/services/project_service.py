import shutil
from pathlib import Path

from app.config import get_settings
from app.models import Project
from app.repositories.project_repo import ProjectRepository
from app.utils.exceptions import ProjectNotFoundError


class ProjectService:
    def __init__(self, repo: ProjectRepository):
        self.repo = repo
        self.settings = get_settings()

    def _get_project_path(self, project_id: str) -> Path:
        return self.settings.projects_dir / project_id

    def _create_project_directories(self, project_id: str) -> None:
        project_path = self._get_project_path(project_id)
        (project_path / "source").mkdir(parents=True, exist_ok=True)
        (project_path / "audio").mkdir(parents=True, exist_ok=True)
        (project_path / "segments").mkdir(parents=True, exist_ok=True)
        (project_path / "output").mkdir(parents=True, exist_ok=True)

    def _delete_project_directories(self, project_id: str) -> None:
        project_path = self._get_project_path(project_id)
        if project_path.exists():
            shutil.rmtree(project_path)

    async def create(self, name: str) -> Project:
        project = await self.repo.create(name)
        self._create_project_directories(project.id)
        return project

    async def get_by_id(self, project_id: str) -> Project:
        project = await self.repo.get_by_id(project_id)
        if not project:
            raise ProjectNotFoundError(project_id)
        return project

    async def list_all(self) -> list[tuple[Project, int]]:
        return await self.repo.list_all()

    async def delete(self, project_id: str) -> None:
        project = await self.get_by_id(project_id)
        self._delete_project_directories(project_id)
        await self.repo.delete(project)

    async def update_source_video(self, project_id: str, video_path: str) -> Project:
        project = await self.get_by_id(project_id)
        return await self.repo.update(project, source_video=video_path)

    async def update_extracted_audio(self, project_id: str, audio_path: str) -> Project:
        project = await self.get_by_id(project_id)
        return await self.repo.update(project, extracted_audio=audio_path)
