"""Tests for reference data endpoints."""

from collections.abc import Generator
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

from vnetplanner_api.main import app
from vnetplanner_api.reference_service import get_reference_service


@pytest.fixture
def mock_reference_service() -> MagicMock:
    """Create a mock ReferenceDataService."""
    service = MagicMock()
    service.is_configured.return_value = True
    return service


@pytest.fixture
def client(mock_reference_service: MagicMock) -> Generator[TestClient, None, None]:
    """Create a test client with mocked reference service."""
    app.dependency_overrides[get_reference_service] = lambda: mock_reference_service
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def mock_delegations_data() -> dict:
    """Sample delegations data."""
    return {
        "id": "delegations",
        "type": "delegations",
        "data": [
            {
                "id": "none",
                "name": "None",
                "serviceName": "",
                "description": "No delegation"
            },
            {
                "id": "appservice",
                "name": "App Service",
                "serviceName": "Microsoft.Web/serverFarms",
                "description": "Azure App Service"
            }
        ]
    }


@pytest.fixture
def mock_service_endpoints_data() -> dict:
    """Sample service endpoints data."""
    return {
        "id": "serviceEndpoints",
        "type": "serviceEndpoints",
        "data": [
            {
                "id": "storage",
                "name": "Azure Storage",
                "service": "Microsoft.Storage",
                "description": "Azure Storage service endpoint"
            }
        ]
    }


@pytest.fixture
def mock_regions_data() -> dict:
    """Sample regions data."""
    return {
        "id": "regions",
        "type": "regions",
        "defaultRegion": "eastus",
        "data": [
            {
                "name": "East US",
                "value": "eastus",
                "geography": "United States",
                "hasAvailabilityZones": True
            },
            {
                "name": "West US",
                "value": "westus",
                "geography": "United States",
                "hasAvailabilityZones": False
            }
        ]
    }


class TestDelegationsEndpoint:
    """Tests for GET /api/2025-02-11/reference/delegations endpoint."""

    def test_get_delegations_returns_200(
        self, client: TestClient, mock_reference_service: MagicMock, mock_delegations_data: dict
    ) -> None:
        """Test that /reference/delegations returns 200 OK."""
        mock_reference_service.get_delegations = AsyncMock(return_value=mock_delegations_data)
        
        response = client.get("/api/2025-02-11/reference/delegations")
        assert response.status_code == 200

    def test_get_delegations_returns_data(
        self, client: TestClient, mock_reference_service: MagicMock, mock_delegations_data: dict
    ) -> None:
        """Test that /reference/delegations returns delegation options."""
        mock_reference_service.get_delegations = AsyncMock(return_value=mock_delegations_data)
        
        response = client.get("/api/2025-02-11/reference/delegations")
        data = response.json()
        
        assert "delegations" in data
        assert len(data["delegations"]) == 2
        assert data["delegations"][0]["id"] == "none"

    def test_get_delegations_returns_404_on_not_found(
        self, client: TestClient, mock_reference_service: MagicMock
    ) -> None:
        """Test that /reference/delegations returns 404 when data not found."""
        mock_reference_service.get_delegations = AsyncMock(return_value=None)
        
        response = client.get("/api/2025-02-11/reference/delegations")
        assert response.status_code == 404


class TestServiceEndpointsEndpoint:
    """Tests for GET /api/2025-02-11/reference/service-endpoints endpoint."""

    def test_get_service_endpoints_returns_200(
        self, client: TestClient, mock_reference_service: MagicMock, mock_service_endpoints_data: dict
    ) -> None:
        """Test that /reference/service-endpoints returns 200 OK."""
        mock_reference_service.get_service_endpoints = AsyncMock(return_value=mock_service_endpoints_data)
        
        response = client.get("/api/2025-02-11/reference/service-endpoints")
        assert response.status_code == 200

    def test_get_service_endpoints_returns_data(
        self, client: TestClient, mock_reference_service: MagicMock, mock_service_endpoints_data: dict
    ) -> None:
        """Test that /reference/service-endpoints returns endpoint options."""
        mock_reference_service.get_service_endpoints = AsyncMock(return_value=mock_service_endpoints_data)
        
        response = client.get("/api/2025-02-11/reference/service-endpoints")
        data = response.json()
        
        assert "serviceEndpoints" in data
        assert len(data["serviceEndpoints"]) == 1
        assert data["serviceEndpoints"][0]["service"] == "Microsoft.Storage"


class TestRegionsEndpoint:
    """Tests for GET /api/2025-02-11/reference/regions endpoint."""

    def test_get_regions_returns_200(
        self, client: TestClient, mock_reference_service: MagicMock, mock_regions_data: dict
    ) -> None:
        """Test that /reference/regions returns 200 OK."""
        mock_reference_service.get_regions = AsyncMock(return_value=mock_regions_data)
        
        response = client.get("/api/2025-02-11/reference/regions")
        assert response.status_code == 200

    def test_get_regions_returns_data(
        self, client: TestClient, mock_reference_service: MagicMock, mock_regions_data: dict
    ) -> None:
        """Test that /reference/regions returns region list with default."""
        mock_reference_service.get_regions = AsyncMock(return_value=mock_regions_data)
        
        response = client.get("/api/2025-02-11/reference/regions")
        data = response.json()
        
        assert "regions" in data
        assert "defaultRegion" in data
        assert data["defaultRegion"] == "eastus"
        assert len(data["regions"]) == 2

    def test_get_regions_includes_availability_zones(
        self, client: TestClient, mock_reference_service: MagicMock, mock_regions_data: dict
    ) -> None:
        """Test that regions include availability zone info."""
        mock_reference_service.get_regions = AsyncMock(return_value=mock_regions_data)
        
        response = client.get("/api/2025-02-11/reference/regions")
        data = response.json()
        
        eastus = next(r for r in data["regions"] if r["value"] == "eastus")
        assert eastus["hasAvailabilityZones"] is True
        
        westus = next(r for r in data["regions"] if r["value"] == "westus")
        assert westus["hasAvailabilityZones"] is False
