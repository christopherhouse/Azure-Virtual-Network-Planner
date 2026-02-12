"""Reference data API router.

Provides endpoints for Azure reference data (delegations, service endpoints, regions).
Uses cache-aside pattern with Redis for performance.

API version: 2025-02-11
"""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from vnetplanner_api.models import (
    AzureRegion,
    DelegationOption,
    DelegationsResponse,
    ErrorResponse,
    RegionsResponse,
    ServiceEndpointOption,
    ServiceEndpointsResponse,
)
from vnetplanner_api.reference_service import ReferenceDataService, get_reference_service

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/2025-02-11/reference",
    tags=["reference"],
    responses={
        404: {"model": ErrorResponse, "description": "Reference data not found"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)


@router.get(
    "/delegations",
    response_model=DelegationsResponse,
    summary="List all subnet delegation options",
    description="Returns all available Azure subnet delegation options for VNet configuration.",
)
async def list_delegations(
    service: Annotated[ReferenceDataService, Depends(get_reference_service)],
) -> DelegationsResponse:
    """List all delegation options."""
    if not service.is_configured():
        logger.warning("Reference data service not configured")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Reference data service is not configured",
        )

    data = await service.get_delegations()

    if data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delegation reference data not found",
        )

    # Parse the data array into DelegationOption models
    delegations = [
        DelegationOption(
            id=item["id"],
            name=item["name"],
            service_name=item["serviceName"],
            description=item["description"],
        )
        for item in data.get("data", [])
    ]

    return DelegationsResponse(
        delegations=delegations,
        total_count=len(delegations),
        last_updated=data.get("lastUpdated", ""),
    )


@router.get(
    "/service-endpoints",
    response_model=ServiceEndpointsResponse,
    summary="List all service endpoint options",
    description="Returns all available Azure virtual network service endpoint options.",
)
async def list_service_endpoints(
    service: Annotated[ReferenceDataService, Depends(get_reference_service)],
) -> ServiceEndpointsResponse:
    """List all service endpoint options."""
    if not service.is_configured():
        logger.warning("Reference data service not configured")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Reference data service is not configured",
        )

    data = await service.get_service_endpoints()

    if data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service endpoints reference data not found",
        )

    # Parse the data array into ServiceEndpointOption models
    endpoints = [
        ServiceEndpointOption(
            id=item["id"],
            name=item["name"],
            service=item["service"],
            description=item["description"],
        )
        for item in data.get("data", [])
    ]

    return ServiceEndpointsResponse(
        service_endpoints=endpoints,
        total_count=len(endpoints),
        last_updated=data.get("lastUpdated", ""),
    )


@router.get(
    "/regions",
    response_model=RegionsResponse,
    summary="List all Azure regions",
    description="Returns all available Azure regions with availability zone and geography information.",
)
async def list_regions(
    service: Annotated[ReferenceDataService, Depends(get_reference_service)],
) -> RegionsResponse:
    """List all Azure regions."""
    if not service.is_configured():
        logger.warning("Reference data service not configured")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Reference data service is not configured",
        )

    data = await service.get_regions()

    if data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Regions reference data not found",
        )

    # Parse the data array into AzureRegion models
    regions = [
        AzureRegion(
            name=item["name"],
            value=item["value"],
            geography=item["geography"],
            has_availability_zones=item["hasAvailabilityZones"],
            is_restricted=item.get("isRestricted"),
        )
        for item in data.get("data", [])
    ]

    return RegionsResponse(
        regions=regions,
        total_count=len(regions),
        default_region=data.get("defaultRegion", "eastus"),
        last_updated=data.get("lastUpdated", ""),
    )
