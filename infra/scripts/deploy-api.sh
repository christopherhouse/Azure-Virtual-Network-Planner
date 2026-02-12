#!/bin/bash
# =============================================================================
# Azure VNet Planner - API Container App Deployment Script
# =============================================================================
# Deploys the API Container App after core infrastructure and image are ready.
# This script is called by the CI/CD pipeline after:
#   1. Core infra (ACR, CAE, KV, UAMI) is deployed
#   2. Container image is built and pushed to GHCR
#   3. Image is promoted to ACR
# =============================================================================

set -euo pipefail

# -----------------------------------------------------------------------------
# Color definitions for pretty output
# -----------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# -----------------------------------------------------------------------------
# Helper functions
# -----------------------------------------------------------------------------
print_header() {
    echo ""
    echo -e "${MAGENTA}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${MAGENTA}║${WHITE}${BOLD}  $1${NC}"
    echo -e "${MAGENTA}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo -e "${CYAN}▶${NC} ${WHITE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✔${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✖${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# -----------------------------------------------------------------------------
# Validate required environment variables
# -----------------------------------------------------------------------------
validate_env() {
    print_header "Validating Environment Variables"
    
    local required_vars=(
        "RESOURCE_GROUP"
        "ENVIRONMENT"
        "ACR_NAME"
        "IMAGE_TAG"
    )
    
    local missing=0
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            print_error "Missing required variable: $var"
            missing=1
        else
            print_success "$var = ${!var}"
        fi
    done
    
    if [[ $missing -eq 1 ]]; then
        print_error "Missing required environment variables. Exiting."
        exit 1
    fi
    
    # Set defaults
    BASE_NAME="${BASE_NAME:-vnetplanner}"
    LOCATION="${LOCATION:-eastus2}"
    TARGET_PORT="${TARGET_PORT:-8000}"
    
    print_info "BASE_NAME = $BASE_NAME (default)"
    print_info "LOCATION = $LOCATION (default)"
    print_info "TARGET_PORT = $TARGET_PORT (default)"
}

# -----------------------------------------------------------------------------
# Compute resource names (must match Bicep naming conventions)
# -----------------------------------------------------------------------------
compute_names() {
    print_header "Computing Resource Names"
    
    RESOURCE_SUFFIX="${BASE_NAME}-${ENVIRONMENT}"
    CONTAINER_APP_NAME="ca-${BASE_NAME}-api-${ENVIRONMENT}"
    CAE_NAME="cae-${RESOURCE_SUFFIX}"
    UAMI_NAME="id-${RESOURCE_SUFFIX}"
    APP_INSIGHTS_NAME="appi-${RESOURCE_SUFFIX}"
    COSMOS_ACCOUNT_NAME="cosmos-${RESOURCE_SUFFIX}"
    REDIS_CACHE_NAME="redis-${RESOURCE_SUFFIX}"
    ACR_LOGIN_SERVER="${ACR_NAME}.azurecr.io"
    CONTAINER_IMAGE="${ACR_LOGIN_SERVER}/${BASE_NAME}-api:${IMAGE_TAG}"
    
    print_success "Container App:    $CONTAINER_APP_NAME"
    print_success "Environment:      $CAE_NAME"
    print_success "Identity:         $UAMI_NAME"
    print_success "App Insights:     $APP_INSIGHTS_NAME"
    print_success "Cosmos DB:        $COSMOS_ACCOUNT_NAME"
    print_success "Redis Cache:      $REDIS_CACHE_NAME"
    print_success "Container Image:  $CONTAINER_IMAGE"
}

# -----------------------------------------------------------------------------
# Get resource IDs from Azure
# -----------------------------------------------------------------------------
fetch_resource_ids() {
    print_header "Fetching Resource IDs from Azure"
    
    print_step "Getting Container Apps Environment ID..."
    CAE_ID=$(az containerapp env show \
        --name "$CAE_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "id" -o tsv)
    print_success "CAE ID: $CAE_ID"
    
    print_step "Getting User Assigned Identity ID and Client ID..."
    UAMI_ID=$(az identity show \
        --name "$UAMI_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "id" -o tsv)
    UAMI_CLIENT_ID=$(az identity show \
        --name "$UAMI_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "clientId" -o tsv)
    print_success "UAMI ID: $UAMI_ID"
    print_success "UAMI Client ID: $UAMI_CLIENT_ID"
    
    print_step "Getting Application Insights connection string..."
    APP_INSIGHTS_CONNECTION_STRING=$(az monitor app-insights component show \
        --app "$APP_INSIGHTS_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "connectionString" -o tsv 2>/dev/null || echo "")
    
    if [[ -n "$APP_INSIGHTS_CONNECTION_STRING" ]]; then
        print_success "App Insights connection string retrieved"
    else
        print_warning "App Insights not found or connection string unavailable"
    fi
    
    print_step "Getting Cosmos DB endpoint..."
    COSMOS_ENDPOINT=$(az cosmosdb show \
        --name "$COSMOS_ACCOUNT_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "documentEndpoint" -o tsv 2>/dev/null || echo "")
    
    if [[ -n "$COSMOS_ENDPOINT" ]]; then
        print_success "Cosmos DB endpoint: $COSMOS_ENDPOINT"
    else
        print_warning "Cosmos DB not found - API will not have database access"
    fi

    print_step "Getting Redis Cache hostname..."
    REDIS_HOST=$(az redis show \
        --name "$REDIS_CACHE_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "hostName" -o tsv 2>/dev/null || echo "")
    
    if [[ -n "$REDIS_HOST" ]]; then
        print_success "Redis host: $REDIS_HOST"
    else
        print_warning "Redis Cache not found - API will not have caching"
    fi
}

# -----------------------------------------------------------------------------
# Check if Container App exists
# -----------------------------------------------------------------------------
check_app_exists() {
    print_header "Checking Container App Status"
    
    print_step "Checking if Container App '$CONTAINER_APP_NAME' exists..."
    
    if az containerapp show \
        --name "$CONTAINER_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "name" -o tsv 2>/dev/null; then
        APP_EXISTS=true
        print_warning "Container App exists - will update"
    else
        APP_EXISTS=false
        print_info "Container App does not exist - will create"
    fi
}

# -----------------------------------------------------------------------------
# Deploy Container App
# -----------------------------------------------------------------------------
deploy_app() {
    print_header "Deploying API Container App"
    
    # Common parameters
    local cpu="0.5"
    local memory="1Gi"
    local min_replicas=1
    local max_replicas=4
    
    # Production overrides
    if [[ "$ENVIRONMENT" == "prod" ]]; then
        cpu="1"
        memory="2Gi"
        min_replicas=1
    fi
    
    print_info "Configuration:"
    print_info "  CPU:          $cpu cores"
    print_info "  Memory:       $memory"
    print_info "  Min Replicas: $min_replicas"
    print_info "  Max Replicas: $max_replicas"
    print_info "  Target Port:  $TARGET_PORT"
    if [[ -n "${COSMOS_ENDPOINT:-}" ]]; then
        print_info "  Cosmos DB:    $COSMOS_ENDPOINT"
    fi
    
    # Build environment variables array
    local env_vars_array=()
    
    if [[ -n "${APP_INSIGHTS_CONNECTION_STRING:-}" ]]; then
        env_vars_array+=("APPLICATIONINSIGHTS_CONNECTION_STRING=$APP_INSIGHTS_CONNECTION_STRING")
    fi
    
    # Add Cosmos DB configuration
    if [[ -n "${COSMOS_ENDPOINT:-}" ]]; then
        env_vars_array+=("COSMOS_ENDPOINT=$COSMOS_ENDPOINT")
        env_vars_array+=("COSMOS_DATABASE_NAME=vnetplanner")
        env_vars_array+=("COSMOS_CONTAINER_NAME=projects")
        env_vars_array+=("COSMOS_REFERENCE_CONTAINER_NAME=reference")
        env_vars_array+=("AZURE_CLIENT_ID=$UAMI_CLIENT_ID")
        # Enable reference data sync on startup
        env_vars_array+=("SYNC_REFERENCE_DATA_ON_STARTUP=true")
        env_vars_array+=("REFERENCE_DATA_DIR=/app/data")
    fi

    # Add Redis configuration
    if [[ -n "${REDIS_HOST:-}" ]]; then
        env_vars_array+=("REDIS_HOST=$REDIS_HOST")
    fi
    
    if [[ "$APP_EXISTS" == "true" ]]; then
        print_step "Updating existing Container App..."
        
        local update_cmd=(
            az containerapp update
            --name "$CONTAINER_APP_NAME"
            --resource-group "$RESOURCE_GROUP"
            --image "$CONTAINER_IMAGE"
            --cpu "$cpu"
            --memory "$memory"
            --min-replicas "$min_replicas"
            --max-replicas "$max_replicas"
            --scale-rule-name "http-scaling"
            --scale-rule-type "http"
            --scale-rule-http-concurrency 50
            --output none
        )
        
        # Configure CORS for SPA access
        az containerapp ingress cors update \
            --name "$CONTAINER_APP_NAME" \
            --resource-group "$RESOURCE_GROUP" \
            --allowed-origins "https://azvnetplanner.chrishou.se" \
            --allowed-methods "GET" "POST" "PUT" "DELETE" "OPTIONS" \
            --allowed-headers "*" \
            --allow-credentials true \
            --output none
        
        if [[ ${#env_vars_array[@]} -gt 0 ]]; then
            update_cmd+=(--set-env-vars "${env_vars_array[@]}")
        fi
        
        "${update_cmd[@]}"
    else
        print_step "Creating new Container App..."
        
        local create_cmd=(
            az containerapp create
            --name "$CONTAINER_APP_NAME"
            --resource-group "$RESOURCE_GROUP"
            --environment "$CAE_NAME"
            --image "$CONTAINER_IMAGE"
            --target-port "$TARGET_PORT"
            --ingress external
            --registry-server "$ACR_LOGIN_SERVER"
            --user-assigned "$UAMI_ID"
            --registry-identity "$UAMI_ID"
            --cpu "$cpu"
            --memory "$memory"
            --min-replicas "$min_replicas"
            --max-replicas "$max_replicas"
            --scale-rule-name "http-scaling"
            --scale-rule-type "http"
            --scale-rule-http-concurrency 50
            --revision-suffix "v${IMAGE_TAG}"
            --output none
        )
        
        if [[ ${#env_vars_array[@]} -gt 0 ]]; then
            create_cmd+=(--env-vars "${env_vars_array[@]}")
        fi
        
        "${create_cmd[@]}"
    fi
    
    print_success "Container App deployed successfully!"
    
    # Configure CORS for SPA access (runs after create to ensure app exists)
    if [[ "$APP_EXISTS" == "false" ]]; then
        print_step "Configuring CORS for SPA access..."
        az containerapp ingress cors update \
            --name "$CONTAINER_APP_NAME" \
            --resource-group "$RESOURCE_GROUP" \
            --allowed-origins "https://azvnetplanner.chrishou.se" \
            --allowed-methods "GET" "POST" "PUT" "DELETE" "OPTIONS" \
            --allowed-headers "*" \
            --allow-credentials true \
            --output none
        print_success "CORS configured for https://azvnetplanner.chrishou.se"
    fi
    
    # Configure health probe
    configure_health_probe
}

# -----------------------------------------------------------------------------
# Configure health probe for /healthz
# -----------------------------------------------------------------------------
configure_health_probe() {
    print_step "Configuring health probe for /healthz..."
    
    az containerapp update \
        --name "$CONTAINER_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --set-env-vars "PLACEHOLDER=placeholder" \
        --output none 2>/dev/null || true
    
    # Note: Full health probe configuration requires YAML or ARM template
    # The Container App will use the default TCP probe until configured via IaC
    print_info "Health probe: Default TCP probe active. Configure /healthz via IaC for HTTP probe."
}

# -----------------------------------------------------------------------------
# Get deployment results
# -----------------------------------------------------------------------------
show_results() {
    print_header "Deployment Complete"
    
    print_step "Fetching Container App details..."
    
    local fqdn=$(az containerapp show \
        --name "$CONTAINER_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "properties.configuration.ingress.fqdn" -o tsv)
    
    local revision=$(az containerapp show \
        --name "$CONTAINER_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "properties.latestRevisionName" -o tsv)
    
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${WHITE}${BOLD}  🚀 API DEPLOYMENT SUCCESSFUL${NC}"
    echo -e "${GREEN}╠══════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║${NC}  ${CYAN}API URL:${NC}      https://$fqdn"
    echo -e "${GREEN}║${NC}  ${CYAN}Health:${NC}       https://$fqdn/healthz"
    echo -e "${GREEN}║${NC}  ${CYAN}Revision:${NC}     $revision"
    echo -e "${GREEN}║${NC}  ${CYAN}Image:${NC}        $CONTAINER_IMAGE"
    echo -e "${GREEN}║${NC}  ${CYAN}Environment:${NC}  $ENVIRONMENT"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# -----------------------------------------------------------------------------
# Main execution
# -----------------------------------------------------------------------------
main() {
    print_header "🚀 Azure VNet Planner - API Container App Deployment"
    
    validate_env
    compute_names
    fetch_resource_ids
    check_app_exists
    deploy_app
    show_results
}

main "$@"
