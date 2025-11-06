#!/bin/bash

# Test MCP Server functionality

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Testing MCP Server${NC}"
echo "===================="

# Check if environment variables are set
if [ -z "$GCS_BUCKET_NAME" ]; then
    echo -e "${RED}Error: GCS_BUCKET_NAME not set${NC}"
    exit 1
fi

if [ -z "$PAYLOAD_API_URL" ]; then
    echo -e "${YELLOW}Warning: PAYLOAD_API_URL not set, using default${NC}"
    export PAYLOAD_API_URL="http://localhost:3000"
fi

# Test 1: List assets
echo -e "${GREEN}Test 1: Listing assets${NC}"
curl -s "${PAYLOAD_API_URL}/api/media?limit=5" | jq '.'

# Test 2: Check GCS bucket access
echo -e "${GREEN}Test 2: Checking GCS bucket access${NC}"
if command -v gsutil &> /dev/null; then
    gsutil ls "gs://${GCS_BUCKET_NAME}" | head -n 5
else
    echo -e "${YELLOW}gsutil not found, skipping GCS test${NC}"
fi

# Test 3: Run MCP server in test mode
echo -e "${GREEN}Test 3: Testing MCP server startup${NC}"
cd ../../../packages/mcp-server-assets
pnpm build

# Create test input
cat > /tmp/mcp-test-input.json <<EOF
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": 1
}
EOF

# Test server (will timeout after 5 seconds)
timeout 5s node dist/index.js < /tmp/mcp-test-input.json || true

echo -e "${GREEN}Tests completed${NC}"
