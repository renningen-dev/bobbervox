import io

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_project(async_client: AsyncClient):
    response = await async_client.post(
        "/api/projects",
        json={"name": "Test Project"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Project"
    assert "id" in data


@pytest.mark.asyncio
async def test_list_projects_empty(async_client: AsyncClient):
    response = await async_client.get("/api/projects")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_list_projects_with_data(async_client: AsyncClient):
    await async_client.post("/api/projects", json={"name": "Project 1"})
    await async_client.post("/api/projects", json={"name": "Project 2"})

    response = await async_client.get("/api/projects")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2


@pytest.mark.asyncio
async def test_get_project(async_client: AsyncClient):
    create_response = await async_client.post(
        "/api/projects",
        json={"name": "Test Project"},
    )
    project_id = create_response.json()["id"]

    response = await async_client.get(f"/api/projects/{project_id}")
    assert response.status_code == 200
    assert response.json()["name"] == "Test Project"


@pytest.mark.asyncio
async def test_get_project_not_found(async_client: AsyncClient):
    response = await async_client.get("/api/projects/nonexistent-id")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_project(async_client: AsyncClient):
    create_response = await async_client.post(
        "/api/projects",
        json={"name": "Test Project"},
    )
    project_id = create_response.json()["id"]

    delete_response = await async_client.delete(f"/api/projects/{project_id}")
    assert delete_response.status_code == 204

    get_response = await async_client.get(f"/api/projects/{project_id}")
    assert get_response.status_code == 404


@pytest.mark.asyncio
async def test_upload_video(async_client: AsyncClient):
    create_response = await async_client.post(
        "/api/projects",
        json={"name": "Test Project"},
    )
    project_id = create_response.json()["id"]

    fake_video = io.BytesIO(b"fake video content")
    response = await async_client.post(
        f"/api/projects/{project_id}/upload",
        files={"file": ("test.mp4", fake_video, "video/mp4")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["source_video"] is not None
    assert "video.mp4" in data["source_video"]


@pytest.mark.asyncio
async def test_upload_video_invalid_extension(async_client: AsyncClient):
    create_response = await async_client.post(
        "/api/projects",
        json={"name": "Test Project"},
    )
    project_id = create_response.json()["id"]

    fake_file = io.BytesIO(b"not a video")
    response = await async_client.post(
        f"/api/projects/{project_id}/upload",
        files={"file": ("test.txt", fake_file, "text/plain")},
    )
    assert response.status_code == 400
