#!/bin/bash
# =============================================================================
# Azure VNet Planner - Container App Deployment Script
# =============================================================================
# Deploys the Container App after core infrastructure and image are ready.
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
    TARGET_PORT="${TARGET_PORT:-3000}"
    
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
    CONTAINER_APP_NAME="ca-${RESOURCE_SUFFIX}"
    CAE_NAME="cae-${RESOURCE_SUFFIX}"
    UAMI_NAME="id-${RESOURCE_SUFFIX}"
    KEY_VAULT_NAME="kv-${RESOURCE_SUFFIX}"
    ACR_LOGIN_SERVER="${ACR_NAME}.azurecr.io"
    CONTAINER_IMAGE="${ACR_LOGIN_SERVER}/${BASE_NAME}:${IMAGE_TAG}"
    
    print_success "Container App:    $CONTAINER_APP_NAME"
    print_success "Environment:      $CAE_NAME"
    print_success "Identity:         $UAMI_NAME"
    print_success "Key Vault:        $KEY_VAULT_NAME"
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
    
    print_step "Getting User Assigned Identity ID..."
    UAMI_ID=$(az identity show \
        --name "$UAMI_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "id" -o tsv)
    print_success "UAMI ID: $UAMI_ID"
    
    print_step "Getting Key Vault URI..."
    KEY_VAULT_URI=$(az keyvault show \
        --name "$KEY_VAULT_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "properties.vaultUri" -o tsv)
    print_success "Key Vault URI: $KEY_VAULT_URI"
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
    print_header "Deploying Container App"
    
    # Common parameters
    local cpu="0.5"
    local memory="1Gi"
    local min_replicas=1
    local max_replicas=4
    local node_env="development"
    
    # Production overrides
    if [[ "$ENVIRONMENT" == "prod" ]]; then
        cpu="1"
        memory="2Gi"
        min_replicas=1
        node_env="production"
    fi
    
    print_info "Configuration:"
    print_info "  CPU:          $cpu cores"
    print_info "  Memory:       $memory"
    print_info "  Min Replicas: $min_replicas"
    print_info "  Max Replicas: $max_replicas"
    print_info "  NODE_ENV:     $node_env"
    
    if [[ "$APP_EXISTS" == "true" ]]; then
        print_step "Updating existing Container App..."
        
        az containerapp update \
            --name "$CONTAINER_APP_NAME" \
            --resource-group "$RESOURCE_GROUP" \
            --image "$CONTAINER_IMAGE" \
            --set-env-vars "NODE_ENV=$node_env" "KEY_VAULT_URI=$KEY_VAULT_URI" \
            --cpu "$cpu" \
            --memory "$memory" \
            --min-replicas "$min_replicas" \
            --max-replicas "$max_replicas" \
            --scale-rule-name "http-scaling" \
            --scale-rule-type "http" \
            --scale-rule-http-concurrency 50 \
            --output none
    else
        print_step "Creating new Container App..."
        
        az containerapp create \
            --name "$CONTAINER_APP_NAME" \
            --resource-group "$RESOURCE_GROUP" \
            --environment "$CAE_NAME" \
            --image "$CONTAINER_IMAGE" \
            --target-port "$TARGET_PORT" \
            --ingress external \
            --registry-server "$ACR_LOGIN_SERVER" \
            --user-assigned "$UAMI_ID" \
            --registry-identity "$UAMI_ID" \
            --env-vars "NODE_ENV=$node_env" "KEY_VAULT_URI=$KEY_VAULT_URI" \
            --cpu "$cpu" \
            --memory "$memory" \
            --min-replicas "$min_replicas" \
            --max-replicas "$max_replicas" \
            --scale-rule-name "http-scaling" \
            --scale-rule-type "http" \
            --scale-rule-http-concurrency 50 \
            --revision-suffix "v${IMAGE_TAG}" \
            --output none
    fi
    
    print_success "Container App deployed successfully!"
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
    echo -e "${GREEN}║${WHITE}${BOLD}  🚀 DEPLOYMENT SUCCESSFUL${NC}"
    echo -e "${GREEN}╠══════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║${NC}  ${CYAN}App URL:${NC}     https://$fqdn"
    echo -e "${GREEN}║${NC}  ${CYAN}Revision:${NC}    $revision"
    echo -e "${GREEN}║${NC}  ${CYAN}Image:${NC}       $CONTAINER_IMAGE"
    echo -e "${GREEN}║${NC}  ${CYAN}Environment:${NC} $ENVIRONMENT"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# -----------------------------------------------------------------------------
# Main execution
# -----------------------------------------------------------------------------
main() {
    print_header "🚀 Azure VNet Planner - Container App Deployment"
    
    validate_env
    compute_names
    fetch_resource_ids
    check_app_exists
    deploy_app
    show_results
}

main "$@"
