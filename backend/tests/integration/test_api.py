import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

@pytest.mark.asyncio
async def test_templates(client: AsyncClient):
    response = await client.get("/api/v1/templates")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
