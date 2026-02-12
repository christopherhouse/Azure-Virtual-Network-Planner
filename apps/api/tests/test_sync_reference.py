"""Tests for sync_reference CLI utility."""

import json
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import MagicMock, patch

import pytest

from vnetplanner_api.cli.sync_reference import (
    load_json_file,
    sync_reference_data,
)


@pytest.fixture
def temp_data_dir() -> TemporaryDirectory:
    """Create a temporary directory with test data files."""
    temp_dir = TemporaryDirectory()
    return temp_dir


@pytest.fixture
def valid_delegations_json() -> dict:
    """Sample valid delegations document."""
    return {
        "id": "delegations",
        "type": "delegations",
        "data": [
            {"id": "none", "name": "None", "serviceName": "", "description": "No delegation"}
        ]
    }


@pytest.fixture
def valid_regions_json() -> dict:
    """Sample valid regions document."""
    return {
        "id": "regions",
        "type": "regions",
        "defaultRegion": "eastus",
        "data": [
            {"name": "East US", "value": "eastus", "geography": "US", "hasAvailabilityZones": True}
        ]
    }


class TestLoadJsonFile:
    """Tests for load_json_file function."""

    def test_load_valid_json(self, temp_data_dir: TemporaryDirectory, valid_delegations_json: dict) -> None:
        """Test loading a valid JSON file."""
        file_path = Path(temp_data_dir.name) / "test.json"
        file_path.write_text(json.dumps(valid_delegations_json))
        
        result = load_json_file(file_path)
        
        assert result["id"] == "delegations"
        assert result["type"] == "delegations"
        assert len(result["data"]) == 1
        temp_data_dir.cleanup()

    def test_load_invalid_json_raises(self, temp_data_dir: TemporaryDirectory) -> None:
        """Test that invalid JSON raises JSONDecodeError."""
        file_path = Path(temp_data_dir.name) / "invalid.json"
        file_path.write_text("{ invalid json }")
        
        with pytest.raises(json.JSONDecodeError):
            load_json_file(file_path)
        temp_data_dir.cleanup()


class TestSyncReferenceDataDryRun:
    """Tests for sync_reference_data in dry run mode."""

    def test_dry_run_valid_files(
        self, temp_data_dir: TemporaryDirectory, valid_delegations_json: dict, valid_regions_json: dict
    ) -> None:
        """Test dry run with valid JSON files."""
        data_path = Path(temp_data_dir.name)
        (data_path / "delegations.json").write_text(json.dumps(valid_delegations_json))
        (data_path / "regions.json").write_text(json.dumps(valid_regions_json))
        
        result = sync_reference_data(
            endpoint="https://test.documents.azure.com:443/",
            data_dir=data_path,
            dry_run=True
        )
        
        assert result == 0  # Dry run returns 0
        temp_data_dir.cleanup()

    def test_dry_run_empty_directory(self, temp_data_dir: TemporaryDirectory) -> None:
        """Test dry run with no JSON files."""
        data_path = Path(temp_data_dir.name)
        
        result = sync_reference_data(
            endpoint="https://test.documents.azure.com:443/",
            data_dir=data_path,
            dry_run=True
        )
        
        assert result == -1  # No files found
        temp_data_dir.cleanup()

    def test_dry_run_missing_id_field(self, temp_data_dir: TemporaryDirectory) -> None:
        """Test dry run fails when document is missing 'id' field."""
        data_path = Path(temp_data_dir.name)
        invalid_doc = {"type": "test", "data": []}  # Missing id
        (data_path / "invalid.json").write_text(json.dumps(invalid_doc))
        
        result = sync_reference_data(
            endpoint="https://test.documents.azure.com:443/",
            data_dir=data_path,
            dry_run=True
        )
        
        assert result == -1  # Validation failed
        temp_data_dir.cleanup()

    def test_dry_run_missing_type_field(self, temp_data_dir: TemporaryDirectory) -> None:
        """Test dry run fails when document is missing 'type' field."""
        data_path = Path(temp_data_dir.name)
        invalid_doc = {"id": "test", "data": []}  # Missing type
        (data_path / "invalid.json").write_text(json.dumps(invalid_doc))
        
        result = sync_reference_data(
            endpoint="https://test.documents.azure.com:443/",
            data_dir=data_path,
            dry_run=True
        )
        
        assert result == -1  # Validation failed
        temp_data_dir.cleanup()


class TestSyncReferenceDataLive:
    """Tests for sync_reference_data with mocked Cosmos client."""

    @patch("vnetplanner_api.cli.sync_reference.get_credential")
    @patch("vnetplanner_api.cli.sync_reference.CosmosClient")
    def test_sync_upserts_documents(
        self,
        mock_cosmos_client_cls: MagicMock,
        mock_get_credential: MagicMock,
        temp_data_dir: TemporaryDirectory,
        valid_delegations_json: dict,
        valid_regions_json: dict,
    ) -> None:
        """Test that sync upserts documents to Cosmos DB."""
        # Setup mock chain
        mock_credential = MagicMock()
        mock_get_credential.return_value = mock_credential
        
        mock_container = MagicMock()
        mock_database = MagicMock()
        mock_database.get_container_client.return_value = mock_container
        
        mock_client = MagicMock()
        mock_client.get_database_client.return_value = mock_database
        mock_cosmos_client_cls.return_value = mock_client
        
        # Create test files
        data_path = Path(temp_data_dir.name)
        (data_path / "delegations.json").write_text(json.dumps(valid_delegations_json))
        (data_path / "regions.json").write_text(json.dumps(valid_regions_json))
        
        result = sync_reference_data(
            endpoint="https://test.documents.azure.com:443/",
            data_dir=data_path,
            dry_run=False
        )
        
        assert result == 2  # 2 documents synced
        assert mock_container.upsert_item.call_count == 2
        temp_data_dir.cleanup()

    @patch("vnetplanner_api.cli.sync_reference.get_credential")
    @patch("vnetplanner_api.cli.sync_reference.CosmosClient")
    def test_sync_handles_upsert_error(
        self,
        mock_cosmos_client_cls: MagicMock,
        mock_get_credential: MagicMock,
        temp_data_dir: TemporaryDirectory,
        valid_delegations_json: dict,
    ) -> None:
        """Test that sync handles upsert errors gracefully."""
        # Setup mock chain with error
        mock_credential = MagicMock()
        mock_get_credential.return_value = mock_credential
        
        mock_container = MagicMock()
        mock_container.upsert_item.side_effect = Exception("Cosmos error")
        mock_database = MagicMock()
        mock_database.get_container_client.return_value = mock_container
        
        mock_client = MagicMock()
        mock_client.get_database_client.return_value = mock_database
        mock_cosmos_client_cls.return_value = mock_client
        
        # Create test file
        data_path = Path(temp_data_dir.name)
        (data_path / "delegations.json").write_text(json.dumps(valid_delegations_json))
        
        result = sync_reference_data(
            endpoint="https://test.documents.azure.com:443/",
            data_dir=data_path,
            dry_run=False
        )
        
        assert result == -1  # Error
        temp_data_dir.cleanup()
