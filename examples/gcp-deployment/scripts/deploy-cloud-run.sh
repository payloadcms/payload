#!/bin/bash

# Deploy Payload CMS to Google Cloud Run

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
PROJECT_ID=${GCP_PROJECT_ID:-""}
REGION=${GCP_REGION:-"us-central1"}
SERVICE_NAME=${SERVICE_NAME:-"payload-cms"}
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo -e "${GREEN}Deploying Payload CMS to Cloud Run${NC}"
echo "===================================="

# Check if project ID is set
if [ -z "$PROJECT_ID" ]; then
    echo -e "${YELLOW}Enter your GCP Project ID:${NC}"
    read -r PROJECT_ID
    IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"
fi

# Set the project
gcloud config set project "$PROJECT_ID"

# Build the Docker image
echo -e "${GREEN}Building Docker image...${NC}"
docker build -t "${IMAGE_NAME}:latest" -f Dockerfile ../../

# Push to Container Registry
echo -e "${GREEN}Pushing image to Container Registry...${NC}"
docker push "${IMAGE_NAME}:latest"

# Deploy to Cloud Run
echo -e "${GREEN}Deploying to Cloud Run...${NC}"
gcloud run deploy "$SERVICE_NAME" \
  --image "${IMAGE_NAME}:latest" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --set-env-vars "GCS_BUCKET_NAME=${GCS_BUCKET_NAME}" \
  --set-env-vars "GCP_PROJECT_ID=${PROJECT_ID}" \
  --set-env-vars "PAYLOAD_SECRET=${PAYLOAD_SECRET}" \
  --set-env-vars "DATABASE_URI=${DATABASE_URI}" \
  --service-account "payload-storage-${ENVIRONMENT:-dev}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0

# Get the service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format 'value(status.url)')

echo -e "${GREEN}Deployment completed!${NC}"
echo -e "${GREEN}Service URL:${NC} $SERVICE_URL"
