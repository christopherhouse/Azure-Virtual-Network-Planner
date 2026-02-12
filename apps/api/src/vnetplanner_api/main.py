"""FastAPI application for Azure Virtual Network Planner API."""

import logging
import os
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

from vnetplanner_api.cosmos import get_cosmos_service
from vnetplanner_api.routers import projects_router
from vnetplanner_api.telemetry import configure_telemetry

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan handler for startup and shutdown events."""
    # Startup
    logger.info("Starting VNet Planner API...")
    configure_telemetry()
    yield
    # Shutdown
    logger.info("Shutting down VNet Planner API...")


# Create FastAPI application
app = FastAPI(
    title="Azure VNet Planner API",
    description="Backend API for Azure Virtual Network Planner",
    version="0.1.0",
    lifespan=lifespan,
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)

# Include routers
app.include_router(projects_router)

# Instrument FastAPI with OpenTelemetry
FastAPIInstrumentor.instrument_app(app)


@app.get("/healthz", response_class=JSONResponse)
async def health_check() -> JSONResponse:
    """Health check endpoint for container orchestration.

    Exercises dependencies and reports their status.
    Returns 200 if service is running (even if dependencies are unhealthy).
    Returns 503 if critical dependencies are unavailable.

    Returns:
        JSONResponse: Health status with dependency statuses as boolean values.
    """
    cosmos = get_cosmos_service()
    database_healthy = await cosmos.check_health()

    status_code = 200 if database_healthy else 503

    return JSONResponse(
        status_code=status_code,
        content={
            "status": "healthy" if database_healthy else "degraded",
            "service": "vnetplanner-api",
            "dependencies": {
                "database": database_healthy,
            },
        },
    )


@app.head("/healthz")
async def health_check_head() -> Response:
    """HEAD health check for Azure Front Door probes.

    Returns minimal response with no body for efficient health probing.
    Checks database health and returns appropriate status code.
    """
    cosmos = get_cosmos_service()
    database_healthy = await cosmos.check_health()

    status_code = 200 if database_healthy else 503
    health_status = "healthy" if database_healthy else "degraded"

    return Response(
        status_code=status_code,
        headers={
            "X-Health-Status": health_status,
            "X-Service": "vnetplanner-api",
            "X-Database-Healthy": str(database_healthy).lower(),
        },
    )


def run() -> None:
    """Run the FastAPI application using uvicorn."""
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))

    uvicorn.run(
        "vnetplanner_api.main:app",
        host=host,
        port=port,
        reload=os.getenv("ENV", "production") == "development",
    )


if __name__ == "__main__":
    run()
