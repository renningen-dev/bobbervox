from __future__ import annotations

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Segment
from app.models.segment import SegmentStatus


class SegmentRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        project_id: str,
        start_time: float,
        end_time: float,
    ) -> Segment:
        segment = Segment(
            project_id=project_id,
            start_time=start_time,
            end_time=end_time,
            status=SegmentStatus.CREATED,
        )
        self.session.add(segment)
        await self.session.flush()
        return segment

    async def get_by_id(self, segment_id: str) -> Optional[Segment]:
        result = await self.session.execute(select(Segment).where(Segment.id == segment_id))
        return result.scalar_one_or_none()

    async def list_by_project(self, project_id: str) -> list[Segment]:
        result = await self.session.execute(
            select(Segment).where(Segment.project_id == project_id).order_by(Segment.start_time)
        )
        return list(result.scalars().all())

    async def delete(self, segment: Segment) -> None:
        await self.session.delete(segment)

    async def update(self, segment: Segment, **kwargs) -> Segment:
        for key, value in kwargs.items():
            setattr(segment, key, value)
        await self.session.flush()
        await self.session.refresh(segment)
        return segment
