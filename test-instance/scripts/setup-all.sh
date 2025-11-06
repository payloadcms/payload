#!/bin/bash

# Complete setup script for Payload test instance with GCP and MCP

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║        Payload Test Instance Setup with GCP & MCP             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${GREEN}[1/8] Checking prerequisites...${NC}"

if ! command_exists node; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

if ! command_exists pnpm; then
    echo -e "${RED}Error: pnpm is not installed${NC}"
    echo "Install with: npm install -g pnpm"
    exit 1
fi

if ! command_exists docker; then
    echo -e "${YELLOW}Warning: Docker is not installed. You'll need to set up PostgreSQL manually.${NC}"
else
    echo -e "${GREEN}✓ Docker found${NC}"
fi

if ! command_exists gcloud; then
    echo -e "${YELLOW}Warning: gcloud CLI not found. You'll need to configure GCP manually.${NC}"
else
    echo -e "${GREEN}✓ gcloud CLI found${NC}"
fi

# Step 1: GCP Configuration
echo -e "\n${GREEN}[2/8] GCP Configuration${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -z "$GCP_PROJECT_ID" ]; then
    echo -e "${YELLOW}Enter your GCP Project ID:${NC}"
    read -r GCP_PROJECT_ID
fi

if [ -z "$GCS_BUCKET_NAME" ]; then
    echo -e "${YELLOW}Enter your GCS Bucket Name (or press Enter for auto-generated):${NC}"
    read -r GCS_BUCKET_NAME
    if [ -z "$GCS_BUCKET_NAME" ]; then
        GCS_BUCKET_NAME="${GCP_PROJECT_ID}-payload-test-$(date +%s)"
    fi
fi

echo -e "${BLUE}Using:${NC}"
echo "  Project ID: $GCP_PROJECT_ID"
echo "  Bucket: $GCS_BUCKET_NAME"

# Ask if user wants automatic GCP setup
echo -e "\n${YELLOW}Do you want to set up GCP infrastructure automatically? (y/n)${NC}"
read -r setup_gcp

if [ "$setup_gcp" = "y" ]; then
    echo -e "${GREEN}Setting up GCP...${NC}"

    # Set project
    gcloud config set project "$GCP_PROJECT_ID"

    # Enable APIs
    echo "Enabling required APIs..."
    gcloud services enable storage.googleapis.com

    # Create bucket
    echo "Creating GCS bucket..."
    if ! gsutil ls -b "gs://${GCS_BUCKET_NAME}" &> /dev/null; then
        gsutil mb -p "$GCP_PROJECT_ID" -c STANDARD -l us-central1 "gs://${GCS_BUCKET_NAME}"

        # Set CORS
        cat > /tmp/cors.json <<EOF
[
  {
    "origin": ["http://localhost:3000", "http://localhost:3001"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF
        gsutil cors set /tmp/cors.json "gs://${GCS_BUCKET_NAME}"
        rm /tmp/cors.json

        # Make bucket public (for testing)
        gsutil iam ch allUsers:objectViewer "gs://${GCS_BUCKET_NAME}"

        echo -e "${GREEN}✓ Bucket created${NC}"
    else
        echo -e "${YELLOW}Bucket already exists${NC}"
    fi

    # Create service account
    SERVICE_ACCOUNT_NAME="payload-test-sa"
    SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${GCP_PROJECT_ID}.iam.gserviceaccount.com"

    echo "Creating service account..."
    if ! gcloud iam service-accounts describe "$SERVICE_ACCOUNT_EMAIL" &> /dev/null; then
        gcloud iam service-accounts create "$SERVICE_ACCOUNT_NAME" \
            --display-name="Payload Test Service Account"
    fi

    # Grant permissions
    gsutil iam ch "serviceAccount:${SERVICE_ACCOUNT_EMAIL}:roles/storage.objectAdmin" "gs://${GCS_BUCKET_NAME}"

    # Create key
    KEY_FILE="../gcp-credentials.json"
    if [ ! -f "$KEY_FILE" ]; then
        gcloud iam service-accounts keys create "$KEY_FILE" \
            --iam-account="$SERVICE_ACCOUNT_EMAIL"
        echo -e "${GREEN}✓ Service account key created: $KEY_FILE${NC}"
    else
        echo -e "${YELLOW}Key file already exists${NC}"
    fi
else
    echo -e "${YELLOW}Skipping automatic GCP setup. Make sure to:${NC}"
    echo "  1. Create a GCS bucket: $GCS_BUCKET_NAME"
    echo "  2. Create a service account with Storage Admin role"
    echo "  3. Download the service account key to ../gcp-credentials.json"
fi

# Step 2: Database Setup
echo -e "\n${GREEN}[3/8] Database Setup${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command_exists docker; then
    echo "Starting PostgreSQL with Docker Compose..."
    cd ..
    docker compose -f docker-compose.test.yml up -d postgres
    cd test-instance

    echo "Waiting for PostgreSQL to be ready..."
    sleep 5

    echo -e "${GREEN}✓ PostgreSQL is running${NC}"
else
    echo -e "${YELLOW}Please ensure PostgreSQL is running on localhost:5432${NC}"
fi

# Step 3: Environment Configuration
echo -e "\n${GREEN}[4/8] Creating environment configuration${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -f .env ]; then
    PAYLOAD_SECRET=$(openssl rand -base64 32)

    cat > .env <<EOF
# Database
DATABASE_URI=postgresql://payload:payload123@localhost:5432/payload-test

# Payload
PAYLOAD_SECRET=${PAYLOAD_SECRET}
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000

# GCP Configuration
GCP_PROJECT_ID=${GCP_PROJECT_ID}
GCS_BUCKET_NAME=${GCS_BUCKET_NAME}
GCP_KEY_FILE=../gcp-credentials.json
GCS_ACL=public

# Node Environment
NODE_ENV=development
EOF

    echo -e "${GREEN}✓ .env file created${NC}"
else
    echo -e "${YELLOW}.env file already exists${NC}"
fi

# Step 4: Install Dependencies
echo -e "\n${GREEN}[5/8] Installing dependencies${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd ..
if [ ! -d "node_modules" ]; then
    echo "Installing root dependencies..."
    pnpm install
fi

echo "Building core packages..."
pnpm run build:core

cd test-instance
pnpm install

echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 5: Run Migrations
echo -e "\n${GREEN}[6/8] Running database migrations${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

pnpm payload migrate

echo -e "${GREEN}✓ Migrations completed${NC}"

# Step 6: Build MCP Server
echo -e "\n${GREEN}[7/8] Building MCP Server${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd ../packages/mcp-server-assets
pnpm install
pnpm build

echo -e "${GREEN}✓ MCP Server built${NC}"

# Step 7: Create Claude Desktop Config
echo -e "\n${GREEN}[8/8] Claude Desktop Configuration${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CLAUDE_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
MCP_SERVER_PATH="$(pwd)/dist/index.js"

echo -e "${YELLOW}To configure Claude Desktop, add this to:${NC}"
echo "$CLAUDE_CONFIG"
echo ""
echo -e "${BLUE}Configuration:${NC}"
cat <<EOF
{
  "mcpServers": {
    "payload-assets": {
      "command": "node",
      "args": ["${MCP_SERVER_PATH}"],
      "env": {
        "GCS_BUCKET_NAME": "${GCS_BUCKET_NAME}",
        "GCP_PROJECT_ID": "${GCP_PROJECT_ID}",
        "GCP_KEY_FILE": "$(pwd)/../../gcp-credentials.json",
        "PAYLOAD_API_URL": "http://localhost:3000",
        "PAYLOAD_API_KEY": "your-api-key-here"
      }
    }
  }
}
EOF

# Summary
echo -e "\n${GREEN}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    Setup Complete! 🎉                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Start Payload:"
echo "     ${GREEN}cd test-instance && pnpm dev${NC}"
echo ""
echo "  2. Open admin panel:"
echo "     ${GREEN}http://localhost:3000/admin${NC}"
echo "     Login: test@payloadcms.com / test"
echo ""
echo "  3. Configure Claude Desktop with the config shown above"
echo ""
echo "  4. Restart Claude Desktop to load the MCP server"
echo ""
echo -e "${YELLOW}Important Files:${NC}"
echo "  • Credentials: ../gcp-credentials.json"
echo "  • Environment: test-instance/.env"
echo "  • MCP Server: packages/mcp-server-assets/dist/index.js"
echo ""
echo -e "${BLUE}Bucket URL:${NC} https://console.cloud.google.com/storage/browser/${GCS_BUCKET_NAME}"
echo -e "${BLUE}Database:${NC} postgresql://payload:payload123@localhost:5432/payload-test"
echo ""
