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
