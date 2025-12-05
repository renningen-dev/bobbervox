import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_segment(async_client: AsyncClient):
    # Create project first
    project_resp = await async_client.post("/api/projects", json={"name": "Test Project"})
    project_id = project_resp.json()["id"]

    response = await async_client.post(
        f"/api/projects/{project_id}/segments",
        json={"start_time": 0.0, "end_time": 5.0},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["start_time"] == 0.0
    assert data["end_time"] == 5.0
    assert data["status"] == "created"
    assert data["project_id"] == project_id


@pytest.mark.asyncio
async def test_create_segment_invalid_times(async_client: AsyncClient):
    project_resp = await async_client.post("/api/projects", json={"name": "Test Project"})
    project_id = project_resp.json()["id"]

    # end_time must be greater than start_time
    response = await async_client.post(
        f"/api/projects/{project_id}/segments",
        json={"start_time": 5.0, "end_time": 3.0},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_segments_empty(async_client: AsyncClient):
    project_resp = await async_client.post("/api/projects", json={"name": "Test Project"})
    project_id = project_resp.json()["id"]

    response = await async_client.get(f"/api/projects/{project_id}/segments")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_list_segments_ordered_by_start_time(async_client: AsyncClient):
    project_resp = await async_client.post("/api/projects", json={"name": "Test Project"})
    project_id = project_resp.json()["id"]

    # Create segments in non-sorted order
    await async_client.post(
        f"/api/projects/{project_id}/segments",
        json={"start_time": 10.0, "end_time": 15.0},
    )
    await async_client.post(
        f"/api/projects/{project_id}/segments",
        json={"start_time": 0.0, "end_time": 5.0},
    )
    await async_client.post(
        f"/api/projects/{project_id}/segments",
        json={"start_time": 5.0, "end_time": 10.0},
    )

    response = await async_client.get(f"/api/projects/{project_id}/segments")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    assert data[0]["start_time"] == 0.0
    assert data[1]["start_time"] == 5.0
    assert data[2]["start_time"] == 10.0


@pytest.mark.asyncio
async def test_get_segment(async_client: AsyncClient):
    project_resp = await async_client.post("/api/projects", json={"name": "Test Project"})
    project_id = project_resp.json()["id"]

    create_resp = await async_client.post(
        f"/api/projects/{project_id}/segments",
        json={"start_time": 0.0, "end_time": 5.0},
    )
    segment_id = create_resp.json()["id"]

    response = await async_client.get(f"/api/segments/{segment_id}")
    assert response.status_code == 200
    assert response.json()["id"] == segment_id


@pytest.mark.asyncio
async def test_get_segment_not_found(async_client: AsyncClient):
    response = await async_client.get("/api/segments/nonexistent-id")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_segment(async_client: AsyncClient):
    project_resp = await async_client.post("/api/projects", json={"name": "Test Project"})
    project_id = project_resp.json()["id"]

    create_resp = await async_client.post(
        f"/api/projects/{project_id}/segments",
        json={"start_time": 0.0, "end_time": 5.0},
    )
    segment_id = create_resp.json()["id"]

    delete_resp = await async_client.delete(f"/api/segments/{segment_id}")
    assert delete_resp.status_code == 204

    get_resp = await async_client.get(f"/api/segments/{segment_id}")
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_update_translation(async_client: AsyncClient):
    project_resp = await async_client.post("/api/projects", json={"name": "Test Project"})
    project_id = project_resp.json()["id"]

    create_resp = await async_client.post(
        f"/api/projects/{project_id}/segments",
        json={"start_time": 0.0, "end_time": 5.0},
    )
    segment_id = create_resp.json()["id"]

    response = await async_client.put(
        f"/api/segments/{segment_id}/translation",
        json={"translated_text": "Hello world"},
    )
    assert response.status_code == 200
    assert response.json()["translated_text"] == "Hello world"


@pytest.mark.asyncio
async def test_update_analysis(async_client: AsyncClient):
    project_resp = await async_client.post("/api/projects", json={"name": "Test Project"})
    project_id = project_resp.json()["id"]

    create_resp = await async_client.post(
        f"/api/projects/{project_id}/segments",
        json={"start_time": 0.0, "end_time": 5.0},
    )
    segment_id = create_resp.json()["id"]

    response = await async_client.put(
        f"/api/segments/{segment_id}/analysis",
        json={"tone": "formal", "emotion": "neutral", "style": "conversational"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["analysis_json"]["tone"] == "formal"
    assert data["analysis_json"]["emotion"] == "neutral"


@pytest.mark.asyncio
async def test_segments_deleted_with_project(async_client: AsyncClient):
    # Create project with segments
    project_resp = await async_client.post("/api/projects", json={"name": "Test Project"})
    project_id = project_resp.json()["id"]

    create_resp = await async_client.post(
        f"/api/projects/{project_id}/segments",
        json={"start_time": 0.0, "end_time": 5.0},
    )
    segment_id = create_resp.json()["id"]

    # Delete project
    await async_client.delete(f"/api/projects/{project_id}")

    # Segment should be gone too (cascade delete)
    get_resp = await async_client.get(f"/api/segments/{segment_id}")
    assert get_resp.status_code == 404
