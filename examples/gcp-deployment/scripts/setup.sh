#!/bin/bash

# Payload CMS GCP Setup Script
# This script sets up the necessary GCP infrastructure for Payload CMS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${GCP_PROJECT_ID:-""}
REGION=${GCP_REGION:-"us-central1"}
ENVIRONMENT=${ENVIRONMENT:-"dev"}
BUCKET_NAME="${PROJECT_ID}-payload-assets"

echo -e "${GREEN}Payload CMS GCP Setup${NC}"
echo "================================"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed${NC}"
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if project ID is set
if [ -z "$PROJECT_ID" ]; then
    echo -e "${YELLOW}Enter your GCP Project ID:${NC}"
    read -r PROJECT_ID
fi

echo -e "${GREEN}Using Project ID: ${PROJECT_ID}${NC}"

# Set the project
echo "Setting GCP project..."
gcloud config set project "$PROJECT_ID"

# Enable required APIs
echo -e "${GREEN}Enabling required GCP APIs...${NC}"
gcloud services enable storage.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable compute.googleapis.com
gcloud services enable iam.googleapis.com

# Create GCS bucket
echo -e "${GREEN}Creating GCS bucket: ${BUCKET_NAME}${NC}"
if ! gsutil ls -b "gs://${BUCKET_NAME}" &> /dev/null; then
    gsutil mb -p "$PROJECT_ID" -c STANDARD -l "$REGION" "gs://${BUCKET_NAME}"

    # Set CORS configuration
    cat > /tmp/cors.json <<EOF
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "responseHeader": ["Content-Type", "Content-Length", "Date"],
    "maxAgeSeconds": 3600
  }
]
EOF
    gsutil cors set /tmp/cors.json "gs://${BUCKET_NAME}"
    rm /tmp/cors.json

    echo -e "${GREEN}Bucket created successfully${NC}"
else
    echo -e "${YELLOW}Bucket already exists${NC}"
fi

# Create service account
SERVICE_ACCOUNT_NAME="payload-storage-${ENVIRONMENT}"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo -e "${GREEN}Creating service account: ${SERVICE_ACCOUNT_NAME}${NC}"
if ! gcloud iam service-accounts describe "$SERVICE_ACCOUNT_EMAIL" &> /dev/null; then
    gcloud iam service-accounts create "$SERVICE_ACCOUNT_NAME" \
        --display-name="Payload Storage Service Account" \
        --description="Service account for Payload CMS to access GCS"
    echo -e "${GREEN}Service account created${NC}"
else
    echo -e "${YELLOW}Service account already exists${NC}"
fi

# Grant permissions
echo -e "${GREEN}Granting permissions to service account...${NC}"
gsutil iam ch "serviceAccount:${SERVICE_ACCOUNT_EMAIL}:roles/storage.objectAdmin" "gs://${BUCKET_NAME}"

# Create service account key
KEY_FILE="payload-storage-${ENVIRONMENT}-key.json"
echo -e "${GREEN}Creating service account key: ${KEY_FILE}${NC}"
if [ ! -f "$KEY_FILE" ]; then
    gcloud iam service-accounts keys create "$KEY_FILE" \
        --iam-account="$SERVICE_ACCOUNT_EMAIL"
    echo -e "${GREEN}Service account key created${NC}"
else
    echo -e "${YELLOW}Key file already exists. Skipping key creation.${NC}"
fi

# Create .env file
echo -e "${GREEN}Creating .env file...${NC}"
cat > .env.example <<EOF
# GCP Configuration
GCP_PROJECT_ID=${PROJECT_ID}
GCS_BUCKET_NAME=${BUCKET_NAME}
GCP_KEY_FILE=./${KEY_FILE}

# Payload Configuration
PAYLOAD_SECRET=$(openssl rand -base64 32)
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000

# Database (PostgreSQL)
DATABASE_URI=postgresql://payload:password@localhost:5432/payload

# MCP Server Configuration
PAYLOAD_API_URL=http://localhost:3000
PAYLOAD_API_KEY=your-api-key-here
EOF

echo -e "${GREEN}Setup completed successfully!${NC}"
echo ""
echo "================================"
echo -e "${GREEN}Next Steps:${NC}"
echo "1. Copy .env.example to .env and update the values"
echo "2. Set up your database (PostgreSQL recommended)"
echo "3. Configure your Payload CMS to use GCS storage"
echo "4. Run 'pnpm install' and 'pnpm build:core'"
echo "5. Start your Payload instance with 'pnpm dev'"
echo ""
echo -e "${YELLOW}Important:${NC}"
echo "- Keep your service account key file secure"
echo "- Never commit the key file to version control"
echo "- Add ${KEY_FILE} to your .gitignore"
echo ""
echo -e "${GREEN}Service Account Email:${NC} ${SERVICE_ACCOUNT_EMAIL}"
echo -e "${GREEN}Bucket Name:${NC} ${BUCKET_NAME}"
echo -e "${GREEN}Key File:${NC} ${KEY_FILE}"
