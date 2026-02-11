"""Cosmos DB client service for project storage.

Uses Azure Managed Identity for authentication when AZURE_CLIENT_ID is set,
otherwise falls back to DefaultAzureCredential for local development.
"""

import logging
import os
from typing import Any

from azure.cosmos import ContainerProxy, CosmosClient, PartitionKey
from azure.cosmos.exceptions import CosmosResourceNotFoundError
from azure.identity import DefaultAzureCredential, ManagedIdentityCredential

logger = logging.getLogger(__name__)


class CosmosDBService:
    """Service for Cosmos DB operations on projects."""

    _instance: "CosmosDBService | None" = None
    _client: CosmosClient | None = None
    _container: ContainerProxy | None = None

    def __init__(self) -> None:
        """Initialize the Cosmos DB service."""
        self._endpoint = os.getenv("COSMOS_ENDPOINT", "")
        self._database_name = os.getenv("COSMOS_DATABASE_NAME", "vnetplanner")
        self._container_name = os.getenv("COSMOS_CONTAINER_NAME", "projects")
        self._client_id = os.getenv("AZURE_CLIENT_ID", "")

    @classmethod
    def get_instance(cls) -> "CosmosDBService":
        """Get singleton instance of the service."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _get_credential(self) -> DefaultAzureCredential | ManagedIdentityCredential:
        """Get the appropriate Azure credential.

        Uses ManagedIdentityCredential with explicit client_id in production,
        DefaultAzureCredential for local development.
        """
        if self._client_id:
            logger.info("Using ManagedIdentityCredential with client_id: %s", self._client_id[:8])
            return ManagedIdentityCredential(client_id=self._client_id)
        else:
            logger.info("Using DefaultAzureCredential (local development)")
            return DefaultAzureCredential()

    def _ensure_client(self) -> ContainerProxy:
        """Ensure the Cosmos client and container are initialized."""
        if self._container is not None:
            return self._container

        if not self._endpoint:
            raise ValueError("COSMOS_ENDPOINT environment variable is not set")

        credential = self._get_credential()

        logger.info("Connecting to Cosmos DB: %s", self._endpoint)
        self._client = CosmosClient(self._endpoint, credential=credential)

        database = self._client.get_database_client(self._database_name)
        self._container = database.get_container_client(self._container_name)

        logger.info(
            "Connected to Cosmos DB - database: %s, container: %s",
            self._database_name,
            self._container_name,
        )

        return self._container

    async def list_projects(self, user_id: str) -> list[dict[str, Any]]:
        """List all projects for a user.

        Args:
            user_id: The user's unique identifier (partition key)

        Returns:
            List of project documents
        """
        container = self._ensure_client()

        query = "SELECT * FROM c WHERE c.userId = @userId"
        parameters: list[dict[str, Any]] = [{"name": "@userId", "value": user_id}]

        items = list(
            container.query_items(
                query=query,
                parameters=parameters,
                partition_key=user_id,
            )
        )

        return items

    async def get_project(self, user_id: str, project_id: str) -> dict[str, Any] | None:
        """Get a specific project by ID.

        Args:
            user_id: The user's unique identifier (partition key)
            project_id: The project ID

        Returns:
            Project document or None if not found
        """
        container = self._ensure_client()

        try:
            item = container.read_item(item=project_id, partition_key=user_id)
            return dict(item)
        except CosmosResourceNotFoundError:
            return None

    async def create_project(self, user_id: str, project: dict[str, Any]) -> dict[str, Any]:
        """Create a new project.

        Args:
            user_id: The user's unique identifier (partition key)
            project: The project data

        Returns:
            Created project document
        """
        container = self._ensure_client()

        document = {
            "id": project["id"],
            "userId": user_id,
            "project": project,
        }

        created = container.create_item(body=document)
        return dict(created)

    async def update_project(
        self, user_id: str, project_id: str, project: dict[str, Any]
    ) -> dict[str, Any] | None:
        """Update an existing project.

        Args:
            user_id: The user's unique identifier (partition key)
            project_id: The project ID
            project: The updated project data

        Returns:
            Updated project document or None if not found
        """
        container = self._ensure_client()

        try:
            # Check if it exists first
            existing = container.read_item(item=project_id, partition_key=user_id)

            # Update the project data
            document = {
                "id": project_id,
                "userId": user_id,
                "project": project,
            }

            updated = container.replace_item(item=existing, body=document)
            return dict(updated)
        except CosmosResourceNotFoundError:
            return None

    async def delete_project(self, user_id: str, project_id: str) -> bool:
        """Delete a project.

        Args:
            user_id: The user's unique identifier (partition key)
            project_id: The project ID

        Returns:
            True if deleted, False if not found
        """
        container = self._ensure_client()

        try:
            container.delete_item(item=project_id, partition_key=user_id)
            return True
        except CosmosResourceNotFoundError:
            return False

    def is_configured(self) -> bool:
        """Check if Cosmos DB is configured."""
        return bool(self._endpoint)


# Singleton instance getter for dependency injection
def get_cosmos_service() -> CosmosDBService:
    """Get the Cosmos DB service instance."""
    return CosmosDBService.get_instance()
