"""CLI utility for syncing reference data to Cosmos DB.

Reads JSON files from the data/ directory and upserts them to the
Cosmos DB reference container.

Usage:
    # Via uv (development)
    uv run python -m vnetplanner_api.cli.sync_reference --data-dir ../../data

    # Via installed package
    sync-reference-data --data-dir ./data

Environment variables required:
    COSMOS_ENDPOINT: Cosmos DB account endpoint
    COSMOS_DATABASE_NAME: Database name (default: vnetplanner)
    COSMOS_REFERENCE_CONTAINER_NAME: Container name (default: reference)
    AZURE_CLIENT_ID: (optional) Managed identity client ID for production
"""

import argparse
import json
import logging
import os
import sys
from pathlib import Path

from azure.cosmos import CosmosClient, PartitionKey
from azure.cosmos.exceptions import CosmosResourceExistsError
from azure.identity import DefaultAzureCredential, ManagedIdentityCredential

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Default configuration
DEFAULT_DATABASE_NAME = "vnetplanner"
DEFAULT_CONTAINER_NAME = "reference"
DEFAULT_DATA_DIR = "data"


def get_credential() -> DefaultAzureCredential | ManagedIdentityCredential:
    """Get the appropriate Azure credential."""
    client_id = os.getenv("AZURE_CLIENT_ID", "")
    if client_id:
        logger.info("Using ManagedIdentityCredential with client_id: %s...", client_id[:8])
        return ManagedIdentityCredential(client_id=client_id)
    else:
        logger.info("Using DefaultAzureCredential (local development)")
        return DefaultAzureCredential()


def ensure_container(client: CosmosClient, database_name: str, container_name: str) -> None:
    """Ensure the reference container exists with correct partition key."""
    database = client.get_database_client(database_name)
    try:
        database.create_container(
            id=container_name,
            partition_key=PartitionKey(path="/type"),
        )
        logger.info("Created container: %s", container_name)
    except CosmosResourceExistsError:
        logger.debug("Container already exists: %s", container_name)


def load_json_file(file_path: Path) -> dict:
    """Load and parse a JSON file."""
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def upsert_document(container, document: dict) -> None:
    """Upsert a document to the container."""
    doc_id = document.get("id", "unknown")
    doc_type = document.get("type", "unknown")
    
    container.upsert_item(document)
    
    item_count = len(document.get("data", []))
    logger.info("Upserted: %s (type=%s, items=%d)", doc_id, doc_type, item_count)


def sync_reference_data(
    endpoint: str,
    data_dir: Path,
    database_name: str = DEFAULT_DATABASE_NAME,
    container_name: str = DEFAULT_CONTAINER_NAME,
    dry_run: bool = False,
) -> int:
    """Sync reference data from JSON files to Cosmos DB.

    Args:
        endpoint: Cosmos DB endpoint URL
        data_dir: Directory containing JSON files
        database_name: Target database name
        container_name: Target container name
        dry_run: If True, only validate without writing

    Returns:
        Number of documents synced (0 for dry run)
    """
    # Find all JSON files in data directory
    json_files = list(data_dir.glob("*.json"))
    
    if not json_files:
        logger.error("No JSON files found in: %s", data_dir)
        return -1
    
    logger.info("Found %d JSON files to sync", len(json_files))
    
    # Load and validate all files first
    documents = []
    for file_path in json_files:
        try:
            doc = load_json_file(file_path)
            
            # Validate required fields
            if "id" not in doc:
                logger.error("Missing 'id' field in: %s", file_path)
                return -1
            if "type" not in doc:
                logger.error("Missing 'type' field in: %s", file_path)
                return -1
            
            documents.append((file_path, doc))
            logger.info("Validated: %s (id=%s, type=%s)", file_path.name, doc["id"], doc["type"])
        except json.JSONDecodeError as e:
            logger.error("Invalid JSON in %s: %s", file_path, e)
            return -1
    
    if dry_run:
        logger.info("Dry run complete - %d documents would be synced", len(documents))
        return 0
    
    # Connect to Cosmos DB
    credential = get_credential()
    client = CosmosClient(endpoint, credential=credential)
    
    # Ensure container exists
    ensure_container(client, database_name, container_name)
    
    # Get container reference
    database = client.get_database_client(database_name)
    container = database.get_container_client(container_name)
    
    # Upsert all documents
    synced_count = 0
    for file_path, doc in documents:
        try:
            upsert_document(container, doc)
            synced_count += 1
        except Exception as e:
            logger.error("Failed to upsert %s: %s", file_path, e)
            return -1
    
    logger.info("Successfully synced %d documents", synced_count)
    return synced_count


def main() -> int:
    """CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Sync reference data JSON files to Cosmos DB",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Environment Variables:
  COSMOS_ENDPOINT                     Cosmos DB account endpoint (required)
  COSMOS_DATABASE_NAME                Database name (default: vnetplanner)
  COSMOS_REFERENCE_CONTAINER_NAME     Container name (default: reference)
  AZURE_CLIENT_ID                     Managed identity client ID (production)

Examples:
  # Sync from default data directory
  sync-reference-data

  # Sync from specific directory
  sync-reference-data --data-dir ./data

  # Dry run (validate only)
  sync-reference-data --dry-run
        """,
    )
    
    parser.add_argument(
        "--data-dir",
        type=Path,
        default=Path(DEFAULT_DATA_DIR),
        help=f"Directory containing JSON files (default: {DEFAULT_DATA_DIR})",
    )
    
    parser.add_argument(
        "--endpoint",
        type=str,
        default=os.getenv("COSMOS_ENDPOINT", ""),
        help="Cosmos DB endpoint (or set COSMOS_ENDPOINT env var)",
    )
    
    parser.add_argument(
        "--database",
        type=str,
        default=os.getenv("COSMOS_DATABASE_NAME", DEFAULT_DATABASE_NAME),
        help=f"Database name (default: {DEFAULT_DATABASE_NAME})",
    )
    
    parser.add_argument(
        "--container",
        type=str,
        default=os.getenv("COSMOS_REFERENCE_CONTAINER_NAME", DEFAULT_CONTAINER_NAME),
        help=f"Container name (default: {DEFAULT_CONTAINER_NAME})",
    )
    
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate files without writing to Cosmos DB",
    )
    
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Enable verbose logging",
    )
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Validate data directory
    if not args.data_dir.exists():
        logger.error("Data directory does not exist: %s", args.data_dir)
        return 1
    
    if not args.data_dir.is_dir():
        logger.error("Not a directory: %s", args.data_dir)
        return 1
    
    # Validate endpoint (unless dry run)
    if not args.dry_run and not args.endpoint:
        logger.error("COSMOS_ENDPOINT environment variable or --endpoint required")
        return 1
    
    # Run sync
    result = sync_reference_data(
        endpoint=args.endpoint,
        data_dir=args.data_dir,
        database_name=args.database,
        container_name=args.container,
        dry_run=args.dry_run,
    )
    
    return 0 if result >= 0 else 1


if __name__ == "__main__":
    sys.exit(main())
