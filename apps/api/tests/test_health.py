"""Tests for health check endpoint."""

import pytest
from fastapi.testclient import TestClient

from vnetplanner_api.main import app


@pytest.fixture
def client() -> TestClient:
    """Create a test client for the FastAPI app."""
    return TestClient(app)


def test_health_check_returns_200(client: TestClient) -> None:
    """Test that /healthz returns 200 OK."""
    response = client.get("/healthz")
    assert response.status_code == 200


def test_health_check_returns_healthy_status(client: TestClient) -> None:
    """Test that /healthz returns healthy status."""
    response = client.get("/healthz")
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "vnetplanner-api"
