"""Pydantic models for the VNet Planner API."""

from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, Field


class DelegationOption(BaseModel):
    """Represents an Azure subnet delegation option."""

    id: str
    name: str
    service_name: Annotated[str, Field(alias="serviceName")]
    description: str

    model_config = {"populate_by_name": True}


class ServiceEndpointOption(BaseModel):
    """Represents an Azure service endpoint option."""

    id: str
    name: str
    service: str
    description: str


class AzureRegion(BaseModel):
    """Represents an Azure region."""

    name: str
    value: str
    geography: str
    has_availability_zones: Annotated[bool, Field(alias="hasAvailabilityZones")]
    is_restricted: Annotated[bool | None, Field(alias="isRestricted")] = None

    model_config = {"populate_by_name": True}


class DelegationsResponse(BaseModel):
    """Response model for delegations reference data."""

    delegations: list[DelegationOption]
    total_count: Annotated[int, Field(alias="totalCount")]
    last_updated: Annotated[str, Field(alias="lastUpdated")]

    model_config = {"populate_by_name": True}


class ServiceEndpointsResponse(BaseModel):
    """Response model for service endpoints reference data."""

    service_endpoints: Annotated[list[ServiceEndpointOption], Field(alias="serviceEndpoints")]
    total_count: Annotated[int, Field(alias="totalCount")]
    last_updated: Annotated[str, Field(alias="lastUpdated")]

    model_config = {"populate_by_name": True}


class RegionsResponse(BaseModel):
    """Response model for regions reference data."""

    regions: list[AzureRegion]
    total_count: Annotated[int, Field(alias="totalCount")]
    default_region: Annotated[str, Field(alias="defaultRegion")]
    last_updated: Annotated[str, Field(alias="lastUpdated")]

    model_config = {"populate_by_name": True}


class Subnet(BaseModel):
    """Represents a subnet within a VNet."""

    id: str
    name: str
    description: str
    cidr: str
    address_prefix: Annotated[str, Field(alias="addressPrefix")]
    delegation: DelegationOption | None = None
    service_endpoints: Annotated[list[ServiceEndpointOption], Field(alias="serviceEndpoints")] = []
    is_allocated: Annotated[bool, Field(alias="isAllocated")] = False
    parent_id: Annotated[str | None, Field(alias="parentId")] = None
    created_at: Annotated[str, Field(alias="createdAt")]
    updated_at: Annotated[str, Field(alias="updatedAt")]

    model_config = {"populate_by_name": True}


class VNet(BaseModel):
    """Represents a Virtual Network."""

    id: str
    name: str
    description: str
    address_space: Annotated[str, Field(alias="addressSpace")]
    region: str
    subnets: list[Subnet] = []
    created_at: Annotated[str, Field(alias="createdAt")]
    updated_at: Annotated[str, Field(alias="updatedAt")]

    model_config = {"populate_by_name": True}


class Project(BaseModel):
    """Represents a project containing multiple VNets."""

    id: str
    name: str
    description: str
    vnets: list[VNet] = []
    created_at: Annotated[str, Field(alias="createdAt")]
    updated_at: Annotated[str, Field(alias="updatedAt")]

    model_config = {"populate_by_name": True}


class ProjectDocument(BaseModel):
    """Cosmos DB document for a project.

    The document has:
    - id: project ID
    - userId: partition key (user's unique identifier)
    - project: the actual project data
    """

    id: str
    user_id: Annotated[str, Field(alias="userId")]
    project: Project

    model_config = {"populate_by_name": True}


class ProjectCreate(BaseModel):
    """Request model for creating a new project."""

    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field(default="", max_length=500)


class ProjectUpdate(BaseModel):
    """Request model for updating a project."""

    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    vnets: list[VNet] | None = None


class ProjectListItem(BaseModel):
    """Summary of a project for list responses."""

    id: str
    name: str
    description: str
    vnet_count: Annotated[int, Field(alias="vnetCount")]
    created_at: Annotated[str, Field(alias="createdAt")]
    updated_at: Annotated[str, Field(alias="updatedAt")]

    model_config = {"populate_by_name": True}


class ProjectListResponse(BaseModel):
    """Response model for listing projects."""

    projects: list[ProjectListItem]
    total_count: Annotated[int, Field(alias="totalCount")]

    model_config = {"populate_by_name": True}


class ErrorResponse(BaseModel):
    """Standard error response."""

    error: str
    detail: str | None = None


def now_iso() -> str:
    """Return current UTC time as ISO 8601 string."""
    return datetime.utcnow().isoformat() + "Z"
