from __future__ import annotations

from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Project, Segment


class ProjectRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        name: str,
        source_language: str = "uk",
        target_language: str = "en",
    ) -> Project:
        project = Project(
            name=name,
            source_language=source_language,
            target_language=target_language,
        )
        self.session.add(project)
        await self.session.flush()
        return project

    async def get_by_id(self, project_id: str) -> Optional[Project]:
        result = await self.session.execute(select(Project).where(Project.id == project_id))
        return result.scalar_one_or_none()

    async def get_by_id_with_segments(self, project_id: str) -> Optional[Project]:
        result = await self.session.execute(
            select(Project).where(Project.id == project_id).options(selectinload(Project.segments))
        )
        return result.scalar_one_or_none()

    async def list_all(self) -> list[tuple[Project, int]]:
        stmt = (
            select(Project, func.count(Segment.id).label("segment_count"))
            .outerjoin(Segment)
            .group_by(Project.id)
            .order_by(Project.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.all())

    async def delete(self, project: Project) -> None:
        await self.session.delete(project)

    async def update(self, project: Project, **kwargs) -> Project:
        for key, value in kwargs.items():
            setattr(project, key, value)
        await self.session.flush()
        await self.session.refresh(project)
        return project
