#!/bin/bash
# Full deployment script for DCA Executor
# Orchestrates secret setup, Cloud Run deploy, and scheduler setup
#
# Idempotent: safe to run multiple times
# No provisioning needed - uses existing GCP project

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================="
echo "  DCA Executor - Full Deployment"
echo "=========================================="
echo ""

# Configuration
export PROJECT_ID="${PROJECT_ID:-agio-digital-develop}"
export REGION="${REGION:-us-central1}"
export SERVICE_NAME="${SERVICE_NAME:-dca-executor}"

echo "Configuration:"
echo "  Project: $PROJECT_ID"
echo "  Region:  $REGION"
echo "  Service: $SERVICE_NAME"
echo ""

# Step 1: Check prerequisites
echo "=== Step 1: Checking prerequisites ==="

# Check gcloud auth
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1 >/dev/null 2>&1; then
    echo "Error: Not logged into gcloud. Run: gcloud auth login"
    exit 1
fi
echo "  [OK] gcloud authenticated"

# Check APIs
REQUIRED_APIS="run.googleapis.com cloudscheduler.googleapis.com secretmanager.googleapis.com cloudbuild.googleapis.com"
for api in $REQUIRED_APIS; do
    if ! gcloud services list --enabled --filter="name:$api" --format="value(name)" --project="$PROJECT_ID" | grep -q "$api"; then
        echo "  Enabling $api..."
        gcloud services enable "$api" --project="$PROJECT_ID"
    fi
done
echo "  [OK] Required APIs enabled"
echo ""

# Step 2: Setup secret (if needed)
echo "=== Step 2: Secret Manager ==="
"$SCRIPT_DIR/setup-secret.sh"
echo ""

# Step 3: Deploy to Cloud Run
echo "=== Step 3: Cloud Run Deployment ==="
"$SCRIPT_DIR/deploy-cloud-run.sh"
echo ""

# Step 4: Setup Scheduler
echo "=== Step 4: Cloud Scheduler ==="
"$SCRIPT_DIR/setup-scheduler.sh"
echo ""

# Summary
echo "=========================================="
echo "  Deployment Complete!"
echo "=========================================="
echo ""

SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
    --project="$PROJECT_ID" \
    --region="$REGION" \
    --format="value(status.url)")

echo "Service: $SERVICE_URL"
echo ""
echo "Quick commands:"
echo "  Test health:  curl $SERVICE_URL/health"
echo "  Test execute: curl -X POST $SERVICE_URL/execute"
echo "  View logs:    gcloud logging read 'resource.type=cloud_run_revision' --project=$PROJECT_ID --limit=20"
echo "  Run now:      gcloud scheduler jobs run dca-executor-trigger --project=$PROJECT_ID --location=$REGION"
