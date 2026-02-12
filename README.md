# Azure VNet Planner

A modern web application for planning Azure Virtual Network (VNet) and subnet configurations. Built with Next.js, Tailwind CSS, and shadcn/ui.

## Features

- **Project Management**: Create and manage multiple VNet planning projects
- **CIDR Calculator**: Automatic subnet math with split/combine capabilities
- **Subnet Configuration**: Configure delegations and service endpoints
- **Export Templates**: Generate ARM, Bicep, or Terraform templates

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **UI**: Tailwind CSS + shadcn/ui
- **Storage**: Browser local storage (no backend required)
- **Deployment**: Azure Container Apps
- **Infrastructure**: Bicep (IaC)
- **CI/CD**: GitHub Actions

## Getting Started

### Prerequisites

- Node.js 22+
- npm 10+

### Local Development

```bash
# Navigate to the app directory
cd app

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
cd app
npm run build
npm start
```

## Project Structure

```
├── app/                    # Next.js application
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # React components
│   │   ├── context/       # React context providers
│   │   ├── lib/           # Utility functions
│   │   └── types/         # TypeScript types
├── infra/                  # Bicep infrastructure
│   ├── modules/           # Bicep modules
│   ├── main.bicep         # Main deployment
│   ├── main.dev.bicepparam
│   └── main.prod.bicepparam
├── .github/workflows/      # CI/CD pipelines
└── Dockerfile             # Container image
```

## Infrastructure Deployment

### Prerequisites

- Azure CLI
- Bicep CLI
- An Azure subscription

### Deploy Infrastructure

```bash
# Login to Azure
az login

# Create resource group
az group create --name rg-vnetplanner-dev --location eastus

# Deploy dev environment
az deployment group create \
  --resource-group rg-vnetplanner-dev \
  --template-file infra/main.bicep \
  --parameters infra/main.dev.bicepparam
```

### CI/CD Setup

1. Create Azure Service Principal:
   ```bash
   az ad sp create-for-rbac --name "github-vnetplanner" --role contributor \
     --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group}
   ```

2. Add GitHub Secrets:
   - `AZURE_CREDENTIALS`: Service principal JSON output

3. Add GitHub Variables per environment:
   - `ACR_NAME`: Azure Container Registry name
   - `CONTAINER_APP_NAME`: Container App name
   - `RESOURCE_GROUP`: Resource group name

## Development

### Version Management

The project uses a single source of truth for versioning:

- **`VERSION`** file at repo root is the source of truth
- Run `./scripts/sync-version.ps1` to sync versions across all projects
- Run `./scripts/sync-version.ps1 -Check` to verify versions are in sync

Version locations automatically synced:
- `apps/web/package.json`
- `apps/api/pyproject.toml`

The Python API reads its version dynamically from `pyproject.toml` at runtime.

### Pre-commit Hooks

Install pre-commit hooks to ensure version sync on every commit:

```bash
# Install pre-commit (if not already installed)
pip install pre-commit

# Install hooks
pre-commit install

# Run manually
pre-commit run --all-files
```

## Usage

1. **Create a Project**: Start by creating a new project to organize your VNets
2. **Add VNets**: Define virtual networks with their address spaces
3. **Configure Subnets**: Add subnets with CIDR ranges, delegations, and service endpoints
4. **Split Subnets**: Use the split feature to divide subnets into smaller ranges
5. **Export**: Generate infrastructure-as-code templates in your preferred format

## License

MIT
