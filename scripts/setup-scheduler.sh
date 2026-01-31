#!/bin/bash
# Setup Cloud Scheduler to trigger DCA Executor
# Idempotent: safe to run multiple times (creates or updates)

set -e

# Configuration
PROJECT_ID="${PROJECT_ID:-agio-digital-develop}"
REGION="${REGION:-us-central1}"
SERVICE_NAME="${SERVICE_NAME:-dca-executor}"
JOB_NAME="${JOB_NAME:-dca-executor-trigger}"
SCHEDULE="${SCHEDULE:-* * * * *}"  # Every 1 minute

echo "=== Setting up Cloud Scheduler ==="
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Job: $JOB_NAME"
echo "Schedule: $SCHEDULE"
echo ""

# Get Cloud Run service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
    --project="$PROJECT_ID" \
    --region="$REGION" \
    --format="value(status.url)" 2>/dev/null)

if [[ -z "$SERVICE_URL" ]]; then
    echo "Error: Cloud Run service '$SERVICE_NAME' not found in $REGION"
    echo "Please run deploy-cloud-run.sh first"
    exit 1
fi

EXECUTE_URL="$SERVICE_URL/execute"
echo "Target URL: $EXECUTE_URL"
echo ""

# Check if job exists
if gcloud scheduler jobs describe "$JOB_NAME" \
    --project="$PROJECT_ID" \
    --location="$REGION" >/dev/null 2>&1; then
    echo "Scheduler job '$JOB_NAME' already exists. Updating..."

    gcloud scheduler jobs update http "$JOB_NAME" \
        --project="$PROJECT_ID" \
        --location="$REGION" \
        --schedule="$SCHEDULE" \
        --uri="$EXECUTE_URL" \
        --http-method=POST \
        --headers="Content-Type=application/json" \
        --message-body='{"limit": 10}' \
        --time-zone="UTC" \
        --attempt-deadline=320s
else
    echo "Creating scheduler job '$JOB_NAME'..."

    gcloud scheduler jobs create http "$JOB_NAME" \
        --project="$PROJECT_ID" \
        --location="$REGION" \
        --schedule="$SCHEDULE" \
        --uri="$EXECUTE_URL" \
        --http-method=POST \
        --headers="Content-Type=application/json" \
        --message-body='{"limit": 10}' \
        --time-zone="UTC" \
        --attempt-deadline=320s
fi

echo ""
echo "=== Scheduler Setup Complete ==="
echo ""
echo "Job: $JOB_NAME"
echo "Schedule: $SCHEDULE"
echo "Target: $EXECUTE_URL"
echo ""
echo "Commands:"
echo "  Run now:  gcloud scheduler jobs run $JOB_NAME --project=$PROJECT_ID --location=$REGION"
echo "  Pause:    gcloud scheduler jobs pause $JOB_NAME --project=$PROJECT_ID --location=$REGION"
echo "  Resume:   gcloud scheduler jobs resume $JOB_NAME --project=$PROJECT_ID --location=$REGION"
echo "  Logs:     gcloud logging read 'resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME' --project=$PROJECT_ID --limit=50"
