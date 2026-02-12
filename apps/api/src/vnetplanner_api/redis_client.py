"""Redis cache client service for reference data caching.

Uses Azure Managed Identity for authentication when AZURE_CLIENT_ID is set,
otherwise falls back to DefaultAzureCredential for local development.

Authentication uses Microsoft Entra ID (AAD) token-based auth, not access keys.
"""

import logging
import os
from typing import Any

import redis
from azure.identity import DefaultAzureCredential, ManagedIdentityCredential

logger = logging.getLogger(__name__)

# Default TTL for cached reference data (1 hour in seconds)
DEFAULT_CACHE_TTL = 3600


class RedisService:
    """Service for Redis cache operations on reference data."""

    _instance: "RedisService | None" = None
    _client: redis.Redis | None = None

    def __init__(self) -> None:
        """Initialize the Redis service."""
        self._host = os.getenv("REDIS_HOST", "")
        self._port = int(os.getenv("REDIS_PORT", "6380"))
        self._client_id = os.getenv("AZURE_CLIENT_ID", "")
        self._ssl = os.getenv("REDIS_SSL", "true").lower() == "true"
        self._default_ttl = int(os.getenv("REDIS_TTL", str(DEFAULT_CACHE_TTL)))

    @classmethod
    def get_instance(cls) -> "RedisService":
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

    def _get_access_token(self) -> str:
        """Get an access token for Redis authentication."""
        credential = self._get_credential()
        # Redis uses the Azure Cache for Redis scope
        token = credential.get_token("https://redis.azure.com/.default")
        return token.token

    def _ensure_client(self) -> redis.Redis:
        """Ensure the Redis client is initialized."""
        if self._client is not None:
            return self._client

        if not self._host:
            raise ValueError("REDIS_HOST environment variable is not set")

        # Get Entra ID access token for authentication
        access_token = self._get_access_token()

        logger.info("Connecting to Redis: %s:%d (SSL=%s)", self._host, self._port, self._ssl)

        # Use the token as the password with the special username
        # For Microsoft Entra ID auth, username is the principal ID or a placeholder
        self._client = redis.Redis(
            host=self._host,
            port=self._port,
            password=access_token,
            ssl=self._ssl,
            ssl_cert_reqs="required" if self._ssl else None,
            decode_responses=True,  # Return strings instead of bytes
            username=self._client_id if self._client_id else "default",
        )

        # Test connection
        self._client.ping()
        logger.info("Connected to Redis successfully")

        return self._client

    def is_configured(self) -> bool:
        """Check if Redis is configured (host is set)."""
        return bool(self._host)

    async def get(self, key: str) -> str | None:
        """Get a value from cache.

        Args:
            key: Cache key

        Returns:
            Cached value as string, or None if not found
        """
        if not self.is_configured():
            logger.debug("Redis not configured, cache miss for key: %s", key)
            return None

        try:
            client = self._ensure_client()
            value = client.get(key)
            if value:
                logger.debug("Cache hit for key: %s", key)
            else:
                logger.debug("Cache miss for key: %s", key)
            return value
        except redis.RedisError as e:
            logger.warning("Redis error on get(%s): %s", key, e)
            return None

    async def set(self, key: str, value: str, ttl: int | None = None) -> bool:
        """Set a value in cache with TTL.

        Args:
            key: Cache key
            value: String value to cache
            ttl: Time-to-live in seconds (defaults to 1 hour)

        Returns:
            True if successful, False otherwise
        """
        if not self.is_configured():
            logger.debug("Redis not configured, skipping cache set for key: %s", key)
            return False

        try:
            client = self._ensure_client()
            effective_ttl = ttl if ttl is not None else self._default_ttl
            client.set(key, value, ex=effective_ttl)
            logger.debug("Cached key: %s (TTL=%ds)", key, effective_ttl)
            return True
        except redis.RedisError as e:
            logger.warning("Redis error on set(%s): %s", key, e)
            return False

    async def delete(self, key: str) -> bool:
        """Delete a value from cache.

        Args:
            key: Cache key

        Returns:
            True if deleted, False otherwise
        """
        if not self.is_configured():
            return False

        try:
            client = self._ensure_client()
            result = client.delete(key)
            logger.debug("Deleted key: %s (found=%s)", key, result > 0)
            return result > 0
        except redis.RedisError as e:
            logger.warning("Redis error on delete(%s): %s", key, e)
            return False

    async def health_check(self) -> dict[str, Any]:
        """Check Redis health.

        Returns:
            Dict with health status information
        """
        if not self.is_configured():
            return {
                "status": "not_configured",
                "host": None,
            }

        try:
            client = self._ensure_client()
            client.ping()
            return {
                "status": "healthy",
                "host": self._host,
            }
        except redis.RedisError as e:
            return {
                "status": "unhealthy",
                "host": self._host,
                "error": str(e),
            }


def get_redis_service() -> RedisService:
    """FastAPI dependency to get the Redis service."""
    return RedisService.get_instance()
