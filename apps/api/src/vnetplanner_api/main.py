"""FastAPI application for Azure Virtual Network Planner API."""

import logging
import os
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any

import uvicorn
from fastapi import FastAPI, Response
from fastapi.responses import JSONResponse
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

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

# Instrument FastAPI with OpenTelemetry
FastAPIInstrumentor.instrument_app(app)


@app.get("/healthz", response_class=JSONResponse)
async def health_check() -> dict[str, Any]:
    """Health check endpoint for container orchestration.

    Returns:
        dict: Health status with 200 OK if the service is running.
    """
    return {"status": "healthy", "service": "vnetplanner-api"}


@app.head("/healthz")
async def health_check_head() -> Response:
    """HEAD health check for Azure Front Door probes.

    Returns minimal response with no body for efficient health probing.
    """
    return Response(
        status_code=200,
        headers={
            "X-Health-Status": "healthy",
            "X-Service": "vnetplanner-api",
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
