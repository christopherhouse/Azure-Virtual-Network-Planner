"""Reference data service for Azure delegations, service endpoints, and regions.

Implements cache-aside pattern: check Redis cache first, then Cosmos DB.
Caches reference data for 1 hour (configurable via REDIS_TTL).
"""

import json
import logging
import os
from typing import Any

from azure.cosmos import ContainerProxy, CosmosClient
from azure.cosmos.exceptions import CosmosResourceNotFoundError
from azure.identity import DefaultAzureCredential, ManagedIdentityCredential

from vnetplanner_api.redis_client import RedisService, get_redis_service

logger = logging.getLogger(__name__)

# Cache key prefixes
CACHE_KEY_DELEGATIONS = "ref:delegations"
CACHE_KEY_SERVICE_ENDPOINTS = "ref:serviceEndpoints"
CACHE_KEY_REGIONS = "ref:regions"


class ReferenceDataService:
    """Service for reference data operations with caching."""

    _instance: "ReferenceDataService | None" = None
    _client: CosmosClient | None = None
    _container: ContainerProxy | None = None

    def __init__(self) -> None:
        """Initialize the reference data service."""
        self._endpoint = os.getenv("COSMOS_ENDPOINT", "")
        self._database_name = os.getenv("COSMOS_DATABASE_NAME", "vnetplanner")
        self._container_name = os.getenv("COSMOS_REFERENCE_CONTAINER_NAME", "reference")
        self._client_id = os.getenv("AZURE_CLIENT_ID", "")
        self._redis: RedisService | None = None

    @classmethod
    def get_instance(cls) -> "ReferenceDataService":
        """Get singleton instance of the service."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _get_credential(self) -> DefaultAzureCredential | ManagedIdentityCredential:
        """Get the appropriate Azure credential."""
        if self._client_id:
            logger.debug("Using ManagedIdentityCredential for reference data")
            return ManagedIdentityCredential(client_id=self._client_id)
        else:
            logger.debug("Using DefaultAzureCredential for reference data")
            return DefaultAzureCredential()

    def _ensure_client(self) -> ContainerProxy:
        """Ensure the Cosmos client and container are initialized."""
        if self._container is not None:
            return self._container

        if not self._endpoint:
            raise ValueError("COSMOS_ENDPOINT environment variable is not set")

        credential = self._get_credential()

        logger.info("Connecting to Cosmos DB reference container: %s", self._endpoint)
        self._client = CosmosClient(self._endpoint, credential=credential)

        database = self._client.get_database_client(self._database_name)
        self._container = database.get_container_client(self._container_name)

        logger.info(
            "Connected to Cosmos DB reference - database: %s, container: %s",
            self._database_name,
            self._container_name,
        )

        return self._container

    def _get_redis(self) -> RedisService:
        """Get Redis service instance."""
        if self._redis is None:
            self._redis = get_redis_service()
        return self._redis

    def is_configured(self) -> bool:
        """Check if Cosmos DB is configured."""
        return bool(self._endpoint)

    async def _get_from_cache(self, cache_key: str) -> dict[str, Any] | None:
        """Try to get data from cache.

        Returns:
            Parsed JSON data if found, None otherwise
        """
        redis = self._get_redis()
        cached = await redis.get(cache_key)
        if cached:
            try:
                return json.loads(cached)
            except json.JSONDecodeError:
                logger.warning("Invalid JSON in cache for key: %s", cache_key)
                await redis.delete(cache_key)
        return None

    async def _set_in_cache(self, cache_key: str, data: dict[str, Any]) -> None:
        """Store data in cache."""
        redis = self._get_redis()
        await redis.set(cache_key, json.dumps(data))

    async def _get_reference_doc(self, doc_type: str, cache_key: str) -> dict[str, Any] | None:
        """Get a reference data document using cache-aside pattern.

        Args:
            doc_type: Document type (partition key value): 'delegations', 'serviceEndpoints', 'regions'
            cache_key: Redis cache key

        Returns:
            Document data or None if not found
        """
        # Check cache first
        cached_data = await self._get_from_cache(cache_key)
        if cached_data:
            logger.info("Cache hit for reference data: %s", doc_type)
            return cached_data

        # Cache miss - fetch from Cosmos DB
        logger.info("Cache miss for reference data: %s", doc_type)

        if not self.is_configured():
            logger.warning("Cosmos DB not configured, cannot fetch %s", doc_type)
            return None

        try:
            container = self._ensure_client()
            # Document ID matches the type
            item = container.read_item(item=doc_type, partition_key=doc_type)

            # Cache the result
            await self._set_in_cache(cache_key, item)
            logger.debug("Fetched and cached %s from Cosmos DB", doc_type)

            return item
        except CosmosResourceNotFoundError:
            logger.warning("Reference data document not found: %s", doc_type)
            return None
        except Exception as e:
            logger.error("Error fetching reference data %s: %s", doc_type, e)
            raise

    async def get_delegations(self) -> dict[str, Any] | None:
        """Get delegation options.

        Returns:
            Delegation data document or None
        """
        return await self._get_reference_doc("delegations", CACHE_KEY_DELEGATIONS)

    async def get_service_endpoints(self) -> dict[str, Any] | None:
        """Get service endpoint options.

        Returns:
            Service endpoints data document or None
        """
        return await self._get_reference_doc("serviceEndpoints", CACHE_KEY_SERVICE_ENDPOINTS)

    async def get_regions(self) -> dict[str, Any] | None:
        """Get Azure regions.

        Returns:
            Regions data document or None
        """
        return await self._get_reference_doc("regions", CACHE_KEY_REGIONS)

    async def invalidate_cache(self, doc_type: str | None = None) -> None:
        """Invalidate cached reference data.

        Args:
            doc_type: Specific type to invalidate, or None for all
        """
        redis = self._get_redis()
        if doc_type is None:
            # Invalidate all
            await redis.delete(CACHE_KEY_DELEGATIONS)
            await redis.delete(CACHE_KEY_SERVICE_ENDPOINTS)
            await redis.delete(CACHE_KEY_REGIONS)
            logger.info("Invalidated all reference data cache")
        elif doc_type == "delegations":
            await redis.delete(CACHE_KEY_DELEGATIONS)
            logger.info("Invalidated delegations cache")
        elif doc_type == "serviceEndpoints":
            await redis.delete(CACHE_KEY_SERVICE_ENDPOINTS)
            logger.info("Invalidated serviceEndpoints cache")
        elif doc_type == "regions":
            await redis.delete(CACHE_KEY_REGIONS)
            logger.info("Invalidated regions cache")


def get_reference_service() -> ReferenceDataService:
    """FastAPI dependency to get the reference data service."""
    return ReferenceDataService.get_instance()
