#!/bin/bash

# Script to validate the test instance setup

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Validating Payload Test Instance Setup"
echo "======================================="
echo ""

errors=0
warnings=0

# Check 1: .env file
echo -n "Checking .env file... "
if [ -f .env ]; then
    echo -e "${GREEN}✓${NC}"

    # Check required variables
    required_vars=("DATABASE_URI" "PAYLOAD_SECRET" "GCP_PROJECT_ID" "GCS_BUCKET_NAME" "GCP_KEY_FILE")
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" .env; then
            echo -e "  ${RED}✗ Missing: $var${NC}"
            ((errors++))
        fi
    done
else
    echo -e "${RED}✗ Not found${NC}"
    ((errors++))
fi

# Check 2: GCP credentials file
echo -n "Checking GCP credentials... "
if [ -f ../gcp-credentials.json ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ ../gcp-credentials.json not found${NC}"
    ((errors++))
fi

# Check 3: Database connection
echo -n "Checking database connection... "
if command -v psql >/dev/null 2>&1; then
    if psql postgresql://payload:payload123@localhost:5432/payload-test -c "SELECT 1" >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗ Cannot connect${NC}"
        ((errors++))
    fi
else
    echo -e "${YELLOW}⚠ psql not available, skipping${NC}"
    ((warnings++))
fi

# Check 4: GCS bucket access
echo -n "Checking GCS bucket... "
if command -v gsutil >/dev/null 2>&1; then
    source .env
    if gsutil ls "gs://${GCS_BUCKET_NAME}" >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗ Cannot access bucket${NC}"
        ((errors++))
    fi
else
    echo -e "${YELLOW}⚠ gsutil not available, skipping${NC}"
    ((warnings++))
fi

# Check 5: Node modules
echo -n "Checking dependencies... "
if [ -d node_modules ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ node_modules not found${NC}"
    ((errors++))
fi

# Check 6: MCP Server build
echo -n "Checking MCP server build... "
if [ -f ../packages/mcp-server-assets/dist/index.js ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠ MCP server not built${NC}"
    ((warnings++))
fi

# Check 7: Port availability
echo -n "Checking port 3000... "
if lsof -i :3000 >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Port 3000 is in use${NC}"
    ((warnings++))
else
    echo -e "${GREEN}✓ Available${NC}"
fi

# Summary
echo ""
echo "Validation Summary"
echo "=================="
echo -e "Errors: ${RED}${errors}${NC}"
echo -e "Warnings: ${YELLOW}${warnings}${NC}"

if [ $errors -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Setup is valid! You can start with: pnpm dev${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}✗ Please fix the errors above before starting${NC}"
    exit 1
fi
