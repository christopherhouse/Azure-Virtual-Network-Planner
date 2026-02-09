# VNet Planner API

Backend API for the Azure Virtual Network Planner.

## Tech Stack

- **Python 3.12** with **FastAPI**
- **UV** for dependency management (no pip!)
- **OpenTelemetry** + **Azure Monitor** for observability
- **Ruff** for linting and formatting
- **mypy** for type checking
- **pytest** for testing

## Development

### Prerequisites

- Python 3.12.x
- [UV](https://docs.astral.sh/uv/) installed (`pip install uv` or `brew install uv`)

### Setup

```bash
cd apps/api

# Sync dependencies (creates .venv automatically)
uv sync

# Run the API locally
uv run uvicorn vnetplanner_api.main:app --reload --port 8000
```

### Available Commands

```bash
# Run tests
uv run pytest

# Run tests with coverage
uv run pytest --cov

# Lint code
uv run ruff check src tests

# Format code
uv run ruff format src tests

# Type check
uv run mypy src
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/healthz` | GET | Health check for container orchestration |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | Azure Application Insights connection string | No (telemetry disabled if not set) |
| `HOST` | Host to bind to | No (default: `0.0.0.0`) |
| `PORT` | Port to listen on | No (default: `8000`) |

## Docker

Build locally:

```bash
# From repo root
docker build -f Dockerfile.api -t vnetplanner-api .
docker run -p 8000:8000 vnetplanner-api
```

## Deployment

The API deploys as a Container App alongside the web frontend. The deployment is handled by the GitHub Actions workflow which:

1. Builds the Docker image and pushes to GHCR
2. Imports to Azure Container Registry
3. Deploys to Azure Container Apps with `/healthz` as the health probe
