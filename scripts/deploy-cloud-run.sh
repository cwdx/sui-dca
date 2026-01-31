#!/bin/bash
# Deploy DCA Executor to Google Cloud Run
# Idempotent: safe to run multiple times (creates or updates)

set -e

# Configuration
PROJECT_ID="${PROJECT_ID:-agio-digital-develop}"
REGION="${REGION:-us-central1}"
SERVICE_NAME="${SERVICE_NAME:-dca-executor}"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

# DCA Contract addresses (mainnet)
DCA_PACKAGE_ID="${DCA_PACKAGE_ID:-0x19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4}"
GLOBAL_CONFIG_ID="${GLOBAL_CONFIG_ID:-0xe9f6adaea71cee4a1d4a3e48e7a42be8d2aa66f1f21e02ffa38e447d6bf3c13a}"
FEE_TRACKER_ID="${FEE_TRACKER_ID:-0x5a840524e2c1cad27da155c6cdeff4652b76bcef1c7aad6f1ce51710e8397057}"
PRICE_FEED_REGISTRY_ID="${PRICE_FEED_REGISTRY_ID:-0xdb8054678f011b6a9d5dbe72b92817bfa904c00729b9c64cc0158ebc2c27d0e0}"

echo "=== Deploying DCA Executor to Cloud Run ==="
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"
echo "Image: $IMAGE_NAME"
echo ""

# Navigate to executor-bun directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXECUTOR_DIR="$SCRIPT_DIR/../executor-bun"

if [[ ! -d "$EXECUTOR_DIR" ]]; then
    echo "Error: executor-bun directory not found at $EXECUTOR_DIR"
    exit 1
fi

cd "$EXECUTOR_DIR"
echo "Building from: $(pwd)"
echo ""

# Build and push container
echo "=== Building container image ==="
gcloud builds submit \
    --project="$PROJECT_ID" \
    --tag="$IMAGE_NAME" \
    --timeout=600s

echo ""
echo "=== Deploying to Cloud Run ==="

# Deploy with secret mounted as env var
gcloud run deploy "$SERVICE_NAME" \
    --project="$PROJECT_ID" \
    --region="$REGION" \
    --image="$IMAGE_NAME" \
    --platform=managed \
    --allow-unauthenticated \
    --memory=512Mi \
    --cpu=1 \
    --timeout=300s \
    --min-instances=0 \
    --max-instances=3 \
    --set-env-vars="SUI_NETWORK=mainnet" \
    --set-env-vars="DCA_PACKAGE_ID=$DCA_PACKAGE_ID" \
    --set-env-vars="GLOBAL_CONFIG_ID=$GLOBAL_CONFIG_ID" \
    --set-env-vars="FEE_TRACKER_ID=$FEE_TRACKER_ID" \
    --set-env-vars="PRICE_FEED_REGISTRY_ID=$PRICE_FEED_REGISTRY_ID" \
    --set-secrets="EXECUTOR_PRIVATE_KEY=DCA_EXECUTOR_PRIVATE_KEY:latest"

echo ""
echo "=== Cleaning up old revisions ==="

# List all revisions except the latest, then delete them
REVISIONS=$(gcloud run revisions list \
    --project="$PROJECT_ID" \
    --region="$REGION" \
    --service="$SERVICE_NAME" \
    --format="value(name)" \
    --sort-by="~creationTimestamp" 2>/dev/null | tail -n +2)

if [[ -n "$REVISIONS" ]]; then
    echo "Removing old revisions..."
    for rev in $REVISIONS; do
        echo "  Deleting $rev..."
        gcloud run revisions delete "$rev" \
            --project="$PROJECT_ID" \
            --region="$REGION" \
            --quiet 2>/dev/null || true
    done
    echo "Old revisions cleaned up."
else
    echo "No old revisions to clean up."
fi

echo ""
echo "=== Deployment Complete ==="

# Get service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
    --project="$PROJECT_ID" \
    --region="$REGION" \
    --format="value(status.url)")

echo ""
echo "Service URL: $SERVICE_URL"
echo ""
echo "Test endpoints:"
echo "  Health:   curl $SERVICE_URL/health"
echo "  Discover: curl $SERVICE_URL/discover"
echo "  Execute:  curl -X POST $SERVICE_URL/execute"
