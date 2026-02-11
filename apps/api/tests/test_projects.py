"""Tests for projects API endpoints."""

import uuid
from collections.abc import Callable, Generator
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import status
from fastapi.testclient import TestClient

from vnetplanner_api.cosmos import get_cosmos_service
from vnetplanner_api.main import app


@pytest.fixture
def valid_user_id() -> str:
    """Generate a valid user ID."""
    return str(uuid.uuid4())


@pytest.fixture
def mock_cosmos_service() -> MagicMock:
    """Create a mock Cosmos DB service."""
    mock = MagicMock()
    mock.is_configured.return_value = True
    mock.list_projects = AsyncMock(return_value=[])
    mock.get_project = AsyncMock(return_value=None)
    mock.create_project = AsyncMock()
    mock.update_project = AsyncMock()
    mock.delete_project = AsyncMock(return_value=True)
    return mock


@pytest.fixture
def override_cosmos() -> Generator[Callable[[MagicMock], None], None, None]:
    """Fixture to override cosmos service dependency."""

    def _override(mock: MagicMock) -> None:
        app.dependency_overrides[get_cosmos_service] = lambda: mock

    yield _override
    app.dependency_overrides.clear()


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    """Create a test client for the FastAPI app."""
    yield TestClient(app)
    app.dependency_overrides.clear()


class TestProjectsEndpointAuth:
    """Tests for authentication/authorization."""

    def test_list_projects_requires_user_id(self, client: TestClient) -> None:
        """Test that X-User-ID header is required."""
        response = client.get("/api/2025-02-11/projects")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "X-User-ID" in response.json()["detail"]

    def test_list_projects_rejects_invalid_user_id(self, client: TestClient) -> None:
        """Test that invalid UUID is rejected."""
        response = client.get(
            "/api/2025-02-11/projects",
            headers={"X-User-ID": "not-a-valid-uuid"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Invalid user ID format" in response.json()["detail"]


class TestListProjects:
    """Tests for GET /api/2025-02-11/projects."""

    def test_list_projects_returns_empty_when_no_cosmos(
        self, client: TestClient, valid_user_id: str, override_cosmos: Callable[[MagicMock], None]
    ) -> None:
        """Test that list returns empty when Cosmos is not configured."""
        mock_service = MagicMock()
        mock_service.is_configured.return_value = False
        override_cosmos(mock_service)

        response = client.get(
            "/api/2025-02-11/projects",
            headers={"X-User-ID": valid_user_id},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["projects"] == []
        assert data["totalCount"] == 0

    def test_list_projects_returns_items(
        self, client: TestClient, valid_user_id: str, override_cosmos: Callable[[MagicMock], None]
    ) -> None:
        """Test that list returns projects from Cosmos."""
        mock_projects = [
            {
                "id": "proj-1",
                "userId": valid_user_id,
                "project": {
                    "id": "proj-1",
                    "name": "Test Project",
                    "description": "A test project",
                    "vnets": [],
                    "createdAt": "2025-01-01T00:00:00Z",
                    "updatedAt": "2025-01-01T00:00:00Z",
                },
            }
        ]

        mock_service = MagicMock()
        mock_service.is_configured.return_value = True
        mock_service.list_projects = AsyncMock(return_value=mock_projects)
        override_cosmos(mock_service)

        response = client.get(
            "/api/2025-02-11/projects",
            headers={"X-User-ID": valid_user_id},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data["projects"]) == 1
        assert data["totalCount"] == 1
        assert data["projects"][0]["name"] == "Test Project"


class TestGetProject:
    """Tests for GET /api/2025-02-11/projects/{project_id}."""

    def test_get_project_not_found(
        self, client: TestClient, valid_user_id: str, override_cosmos: Callable[[MagicMock], None]
    ) -> None:
        """Test 404 when project doesn't exist."""
        mock_service = MagicMock()
        mock_service.is_configured.return_value = True
        mock_service.get_project = AsyncMock(return_value=None)
        override_cosmos(mock_service)

        response = client.get(
            "/api/2025-02-11/projects/nonexistent-id",
            headers={"X-User-ID": valid_user_id},
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_get_project_success(
        self, client: TestClient, valid_user_id: str, override_cosmos: Callable[[MagicMock], None]
    ) -> None:
        """Test successful project retrieval."""
        mock_doc = {
            "id": "proj-1",
            "userId": valid_user_id,
            "project": {
                "id": "proj-1",
                "name": "Test Project",
                "description": "A test project",
                "vnets": [],
                "createdAt": "2025-01-01T00:00:00Z",
                "updatedAt": "2025-01-01T00:00:00Z",
            },
        }

        mock_service = MagicMock()
        mock_service.is_configured.return_value = True
        mock_service.get_project = AsyncMock(return_value=mock_doc)
        override_cosmos(mock_service)

        response = client.get(
            "/api/2025-02-11/projects/proj-1",
            headers={"X-User-ID": valid_user_id},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == "proj-1"
        assert data["name"] == "Test Project"


class TestCreateProject:
    """Tests for POST /api/2025-02-11/projects."""

    def test_create_project_success(
        self, client: TestClient, valid_user_id: str, override_cosmos: Callable[[MagicMock], None]
    ) -> None:
        """Test successful project creation."""
        mock_service = MagicMock()
        mock_service.is_configured.return_value = True
        mock_service.create_project = AsyncMock(return_value={})
        override_cosmos(mock_service)

        response = client.post(
            "/api/2025-02-11/projects",
            headers={"X-User-ID": valid_user_id},
            json={"name": "New Project", "description": "A new project"},
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["name"] == "New Project"
        assert data["description"] == "A new project"
        assert "id" in data
        assert "createdAt" in data
        assert "updatedAt" in data

    def test_create_project_validates_name(
        self, client: TestClient, valid_user_id: str, override_cosmos: Callable[[MagicMock], None]
    ) -> None:
        """Test that empty name is rejected."""
        mock_service = MagicMock()
        mock_service.is_configured.return_value = True
        override_cosmos(mock_service)

        response = client.post(
            "/api/2025-02-11/projects",
            headers={"X-User-ID": valid_user_id},
            json={"name": "", "description": ""},
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT

    def test_create_project_service_unavailable(
        self, client: TestClient, valid_user_id: str, override_cosmos: Callable[[MagicMock], None]
    ) -> None:
        """Test 503 when Cosmos is not configured."""
        mock_service = MagicMock()
        mock_service.is_configured.return_value = False
        override_cosmos(mock_service)

        response = client.post(
            "/api/2025-02-11/projects",
            headers={"X-User-ID": valid_user_id},
            json={"name": "New Project"},
        )

        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE


class TestUpdateProject:
    """Tests for PUT /api/2025-02-11/projects/{project_id}."""

    def test_update_project_not_found(
        self, client: TestClient, valid_user_id: str, override_cosmos: Callable[[MagicMock], None]
    ) -> None:
        """Test 404 when project doesn't exist."""
        mock_service = MagicMock()
        mock_service.is_configured.return_value = True
        mock_service.get_project = AsyncMock(return_value=None)
        override_cosmos(mock_service)

        response = client.put(
            "/api/2025-02-11/projects/nonexistent",
            headers={"X-User-ID": valid_user_id},
            json={"name": "Updated Name"},
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_update_project_success(
        self, client: TestClient, valid_user_id: str, override_cosmos: Callable[[MagicMock], None]
    ) -> None:
        """Test successful project update."""
        mock_doc = {
            "id": "proj-1",
            "userId": valid_user_id,
            "project": {
                "id": "proj-1",
                "name": "Original Name",
                "description": "Original description",
                "vnets": [],
                "createdAt": "2025-01-01T00:00:00Z",
                "updatedAt": "2025-01-01T00:00:00Z",
            },
        }

        mock_service = MagicMock()
        mock_service.is_configured.return_value = True
        mock_service.get_project = AsyncMock(return_value=mock_doc)
        mock_service.update_project = AsyncMock(return_value={})
        override_cosmos(mock_service)

        response = client.put(
            "/api/2025-02-11/projects/proj-1",
            headers={"X-User-ID": valid_user_id},
            json={"name": "Updated Name"},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "Updated Name"
        # Description should remain unchanged
        assert data["description"] == "Original description"


class TestDeleteProject:
    """Tests for DELETE /api/2025-02-11/projects/{project_id}."""

    def test_delete_project_not_found(
        self, client: TestClient, valid_user_id: str, override_cosmos: Callable[[MagicMock], None]
    ) -> None:
        """Test 404 when project doesn't exist."""
        mock_service = MagicMock()
        mock_service.is_configured.return_value = True
        mock_service.delete_project = AsyncMock(return_value=False)
        override_cosmos(mock_service)

        response = client.delete(
            "/api/2025-02-11/projects/nonexistent",
            headers={"X-User-ID": valid_user_id},
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_delete_project_success(
        self, client: TestClient, valid_user_id: str, override_cosmos: Callable[[MagicMock], None]
    ) -> None:
        """Test successful project deletion."""
        mock_service = MagicMock()
        mock_service.is_configured.return_value = True
        mock_service.delete_project = AsyncMock(return_value=True)
        override_cosmos(mock_service)

        response = client.delete(
            "/api/2025-02-11/projects/proj-1",
            headers={"X-User-ID": valid_user_id},
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT
