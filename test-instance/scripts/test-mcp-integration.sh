#!/bin/bash

# Test MCP Server Integration with Payload

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

source ../.env 2>/dev/null || source .env

echo -e "${BLUE}Testing MCP Server Integration${NC}"
echo "========================================"
echo ""

# Check if Payload is running
echo -n "Checking if Payload is running... "
if curl -s http://localhost:3000/api/access > /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo "Please start Payload first: pnpm dev"
    exit 1
fi

# Test 1: List media assets
echo -e "\n${GREEN}Test 1: Listing media assets${NC}"
response=$(curl -s http://localhost:3000/api/media?limit=5)
count=$(echo $response | jq '.totalDocs // 0')
echo "Found $count assets"
echo "$response" | jq '{totalDocs, docs: [.docs[] | {id, filename, alt}]}'

# Test 2: Check GCS bucket
echo -e "\n${GREEN}Test 2: Checking GCS bucket access${NC}"
if command -v gsutil >/dev/null 2>&1; then
    file_count=$(gsutil ls "gs://${GCS_BUCKET_NAME}" 2>/dev/null | wc -l || echo "0")
    echo "Files in bucket: $file_count"

    if [ "$file_count" -gt 0 ]; then
        echo "Sample files:"
        gsutil ls "gs://${GCS_BUCKET_NAME}" | head -n 5
    fi
else
    echo -e "${YELLOW}gsutil not available${NC}"
fi

# Test 3: GraphQL endpoint
echo -e "\n${GREEN}Test 3: Testing GraphQL endpoint${NC}"
query='{"query":"{ Media(limit: 3) { docs { id filename } } }"}'
response=$(curl -s -X POST http://localhost:3000/api/graphql \
    -H "Content-Type: application/json" \
    -d "$query")
echo "$response" | jq '.'

# Test 4: Generate API key for MCP
echo -e "\n${GREEN}Test 4: User authentication${NC}"
echo "Login to get API token..."
login_response=$(curl -s -X POST http://localhost:3000/api/users/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@payloadcms.com","password":"test"}')

token=$(echo $login_response | jq -r '.token // empty')
if [ -n "$token" ]; then
    echo -e "${GREEN}✓ Authentication successful${NC}"
    echo "Token: ${token:0:20}..."

    # Test authenticated request
    echo -e "\n${GREEN}Test 5: Authenticated request${NC}"
    auth_response=$(curl -s http://localhost:3000/api/media?limit=1 \
        -H "Authorization: Bearer $token")
    echo "$auth_response" | jq '{totalDocs, user: .user.email}'
else
    echo -e "${YELLOW}⚠ Could not authenticate${NC}"
fi

# MCP Server Configuration
echo -e "\n${GREEN}Test 6: MCP Server Configuration${NC}"
echo "To configure Claude Desktop, use this token in PAYLOAD_API_KEY"
echo ""
echo "MCP Server environment should include:"
echo "  PAYLOAD_API_URL=http://localhost:3000"
if [ -n "$token" ]; then
    echo "  PAYLOAD_API_KEY=$token"
fi
echo "  GCS_BUCKET_NAME=$GCS_BUCKET_NAME"
echo "  GCP_PROJECT_ID=$GCP_PROJECT_ID"

# Summary
echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}Integration tests completed!${NC}"
echo ""
echo "Next steps:"
echo "  1. Keep Payload running (pnpm dev)"
echo "  2. Configure Claude Desktop with the MCP server"
echo "  3. Restart Claude Desktop"
echo "  4. Try asking Claude to: 'List my Payload media assets'"
echo ""
