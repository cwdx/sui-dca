#!/bin/bash
# Setup executor private key in Google Secret Manager
# Idempotent: safe to run multiple times

set -e

PROJECT_ID="${PROJECT_ID:-agio-digital-develop}"
SECRET_NAME="DCA_EXECUTOR_PRIVATE_KEY"
FORCE_UPDATE="${FORCE_UPDATE:-false}"

echo "=== Setting up Secret Manager ==="
echo "Project: $PROJECT_ID"
echo "Secret: $SECRET_NAME"
echo ""

# Check if secret exists and has a version
if gcloud secrets describe "$SECRET_NAME" --project="$PROJECT_ID" >/dev/null 2>&1; then
    # Check if it has at least one version
    VERSION_COUNT=$(gcloud secrets versions list "$SECRET_NAME" --project="$PROJECT_ID" --format="value(name)" 2>/dev/null | wc -l | tr -d ' ')

    if [[ "$VERSION_COUNT" -gt 0 && "$FORCE_UPDATE" != "true" ]]; then
        echo "Secret '$SECRET_NAME' already exists with $VERSION_COUNT version(s)."
        echo "  [OK] Skipping (use FORCE_UPDATE=true to update)"
        exit 0
    elif [[ "$VERSION_COUNT" -gt 0 ]]; then
        echo "Secret exists. Adding new version (FORCE_UPDATE=true)..."
    fi
else
    echo "Creating secret '$SECRET_NAME'..."
    gcloud secrets create "$SECRET_NAME" \
        --project="$PROJECT_ID" \
        --replication-policy="automatic"
    echo "Secret created."
fi

# Prompt for private key
echo ""
echo "Enter the executor private key (suiprivkey... format):"
echo "(Input will be hidden)"
read -s PRIVATE_KEY

if [[ -z "$PRIVATE_KEY" ]]; then
    echo "Error: Private key cannot be empty"
    exit 1
fi

# Add secret version
echo ""
echo "Adding secret version..."
echo -n "$PRIVATE_KEY" | gcloud secrets versions add "$SECRET_NAME" \
    --project="$PROJECT_ID" \
    --data-file=-

echo ""
echo "Secret '$SECRET_NAME' configured successfully."
echo ""
echo "To verify:"
echo "  gcloud secrets versions access latest --secret=$SECRET_NAME --project=$PROJECT_ID"
