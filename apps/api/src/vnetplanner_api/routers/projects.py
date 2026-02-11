"""Projects API router.

All endpoints require X-User-ID header for user identification.
API version: 2025-02-11
"""

import logging
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, status

from vnetplanner_api.cosmos import CosmosDBService, get_cosmos_service
from vnetplanner_api.models import (
    ErrorResponse,
    Project,
    ProjectCreate,
    ProjectListItem,
    ProjectListResponse,
    ProjectUpdate,
    now_iso,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/2025-02-11/projects",
    tags=["projects"],
    responses={
        401: {"model": ErrorResponse, "description": "Missing or invalid user ID"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)


def get_user_id(x_user_id: Annotated[str | None, Header()] = None) -> str:
    """Extract and validate user ID from request header.

    Args:
        x_user_id: User ID from X-User-ID header

    Returns:
        Validated user ID

    Raises:
        HTTPException: If user ID is missing or invalid
    """
    if not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-User-ID header is required",
        )

    # Validate UUID format
    try:
        uuid.UUID(x_user_id)
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID format - must be a valid UUID",
        ) from err

    return x_user_id


@router.get(
    "",
    response_model=ProjectListResponse,
    summary="List all projects",
    description="Returns a list of all projects for the authenticated user.",
)
async def list_projects(
    user_id: Annotated[str, Depends(get_user_id)],
    cosmos: Annotated[CosmosDBService, Depends(get_cosmos_service)],
) -> ProjectListResponse:
    """List all projects for the user."""
    if not cosmos.is_configured():
        logger.warning("Cosmos DB not configured, returning empty list")
        return ProjectListResponse(projects=[], total_count=0)

    try:
        documents = await cosmos.list_projects(user_id)

        items = []
        for doc in documents:
            project = doc.get("project", {})
            items.append(
                ProjectListItem(
                    id=project.get("id", ""),
                    name=project.get("name", ""),
                    description=project.get("description", ""),
                    vnet_count=len(project.get("vnets", [])),
                    created_at=project.get("createdAt", ""),
                    updated_at=project.get("updatedAt", ""),
                )
            )

        return ProjectListResponse(projects=items, total_count=len(items))

    except Exception as e:
        logger.exception("Error listing projects: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list projects: {str(e)}",
        ) from e


@router.get(
    "/{project_id}",
    response_model=Project,
    summary="Get a project",
    description="Returns a specific project by ID.",
    responses={404: {"model": ErrorResponse, "description": "Project not found"}},
)
async def get_project(
    project_id: str,
    user_id: Annotated[str, Depends(get_user_id)],
    cosmos: Annotated[CosmosDBService, Depends(get_cosmos_service)],
) -> Project:
    """Get a specific project by ID."""
    if not cosmos.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available",
        )

    try:
        document = await cosmos.get_project(user_id, project_id)

        if document is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project {project_id} not found",
            )

        project_data = document.get("project", {})
        return Project(**project_data)

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error getting project %s: %s", project_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get project: {str(e)}",
        ) from e


@router.post(
    "",
    response_model=Project,
    status_code=status.HTTP_201_CREATED,
    summary="Create a project",
    description="Creates a new project for the authenticated user.",
)
async def create_project(
    project_create: ProjectCreate,
    user_id: Annotated[str, Depends(get_user_id)],
    cosmos: Annotated[CosmosDBService, Depends(get_cosmos_service)],
) -> Project:
    """Create a new project."""
    if not cosmos.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available",
        )

    try:
        now = now_iso()
        project_id = str(uuid.uuid4())

        project = Project(
            id=project_id,
            name=project_create.name,
            description=project_create.description,
            vnets=[],
            created_at=now,
            updated_at=now,
        )

        await cosmos.create_project(user_id, project.model_dump(by_alias=True))

        logger.info("Created project %s for user %s", project_id, user_id[:8])
        return project

    except Exception as e:
        logger.exception("Error creating project: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create project: {str(e)}",
        ) from e


@router.put(
    "/{project_id}",
    response_model=Project,
    summary="Update a project",
    description="Updates an existing project. Supports partial updates.",
    responses={404: {"model": ErrorResponse, "description": "Project not found"}},
)
async def update_project(
    project_id: str,
    project_update: ProjectUpdate,
    user_id: Annotated[str, Depends(get_user_id)],
    cosmos: Annotated[CosmosDBService, Depends(get_cosmos_service)],
) -> Project:
    """Update an existing project."""
    if not cosmos.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available",
        )

    try:
        # Get existing project
        document = await cosmos.get_project(user_id, project_id)

        if document is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project {project_id} not found",
            )

        existing_project = document.get("project", {})

        # Apply updates
        if project_update.name is not None:
            existing_project["name"] = project_update.name
        if project_update.description is not None:
            existing_project["description"] = project_update.description
        if project_update.vnets is not None:
            existing_project["vnets"] = [v.model_dump(by_alias=True) for v in project_update.vnets]

        existing_project["updatedAt"] = now_iso()

        # Save
        await cosmos.update_project(user_id, project_id, existing_project)

        logger.info("Updated project %s for user %s", project_id, user_id[:8])
        return Project(**existing_project)

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error updating project %s: %s", project_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update project: {str(e)}",
        ) from e


@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a project",
    description="Deletes a project and all its VNets.",
    responses={404: {"model": ErrorResponse, "description": "Project not found"}},
)
async def delete_project(
    project_id: str,
    user_id: Annotated[str, Depends(get_user_id)],
    cosmos: Annotated[CosmosDBService, Depends(get_cosmos_service)],
) -> None:
    """Delete a project."""
    if not cosmos.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available",
        )

    try:
        deleted = await cosmos.delete_project(user_id, project_id)

        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project {project_id} not found",
            )

        logger.info("Deleted project %s for user %s", project_id, user_id[:8])

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error deleting project %s: %s", project_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete project: {str(e)}",
        ) from e
