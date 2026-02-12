"""Tests for health check endpoint."""

from collections.abc import Generator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from vnetplanner_api.main import app


@pytest.fixture
def client() -> TestClient:
    """Create a test client for the FastAPI app."""
    return TestClient(app)


@pytest.fixture
def mock_cosmos_healthy() -> Generator[MagicMock, None, None]:
    """Mock Cosmos service returning healthy status."""
    with patch("vnetplanner_api.main.get_cosmos_service") as mock:
        service = MagicMock()
        service.check_health = AsyncMock(return_value=True)
        mock.return_value = service
        yield mock


@pytest.fixture
def mock_cosmos_unhealthy() -> Generator[MagicMock, None, None]:
    """Mock Cosmos service returning unhealthy status."""
    with patch("vnetplanner_api.main.get_cosmos_service") as mock:
        service = MagicMock()
        service.check_health = AsyncMock(return_value=False)
        mock.return_value = service
        yield mock


class TestHealthCheckGet:
    """Tests for GET /healthz endpoint."""

    @pytest.mark.usefixtures("mock_cosmos_healthy")
    def test_health_check_returns_200_when_healthy(self, client: TestClient) -> None:
        """Test that /healthz returns 200 OK when database is healthy."""
        response = client.get("/healthz")
        assert response.status_code == 200

    @pytest.mark.usefixtures("mock_cosmos_unhealthy")
    def test_health_check_returns_503_when_unhealthy(self, client: TestClient) -> None:
        """Test that /healthz returns 503 when database is unhealthy."""
        response = client.get("/healthz")
        assert response.status_code == 503

    @pytest.mark.usefixtures("mock_cosmos_healthy")
    def test_health_check_returns_healthy_status(self, client: TestClient) -> None:
        """Test that /healthz returns healthy status with dependencies."""
        response = client.get("/healthz")
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "vnetplanner-api"
        assert data["dependencies"]["database"] is True

    @pytest.mark.usefixtures("mock_cosmos_healthy")
    def test_health_check_includes_metrics(self, client: TestClient) -> None:
        """Test that /healthz includes response time metrics."""
        response = client.get("/healthz")
        data = response.json()
        assert "metrics" in data
        assert "databaseResponseTimeMs" in data["metrics"]
        assert isinstance(data["metrics"]["databaseResponseTimeMs"], (int, float))
        assert data["metrics"]["databaseResponseTimeMs"] >= 0

    @pytest.mark.usefixtures("mock_cosmos_unhealthy")
    def test_health_check_returns_degraded_status_when_db_unhealthy(
        self, client: TestClient
    ) -> None:
        """Test that /healthz returns degraded status when database is down."""
        response = client.get("/healthz")
        data = response.json()
        assert data["status"] == "degraded"
        assert data["service"] == "vnetplanner-api"
        assert data["dependencies"]["database"] is False


class TestHealthCheckHead:
    """Tests for HEAD /healthz endpoint."""

    @pytest.mark.usefixtures("mock_cosmos_healthy")
    def test_head_health_check_returns_200_when_healthy(self, client: TestClient) -> None:
        """Test that HEAD /healthz returns 200 OK when healthy."""
        response = client.head("/healthz")
        assert response.status_code == 200
        assert response.headers["X-Health-Status"] == "healthy"
        assert response.headers["X-Database-Healthy"] == "true"

    @pytest.mark.usefixtures("mock_cosmos_unhealthy")
    def test_head_health_check_returns_503_when_unhealthy(self, client: TestClient) -> None:
        """Test that HEAD /healthz returns 503 when unhealthy."""
        response = client.head("/healthz")
        assert response.status_code == 503
        assert response.headers["X-Health-Status"] == "degraded"
        assert response.headers["X-Database-Healthy"] == "false"
