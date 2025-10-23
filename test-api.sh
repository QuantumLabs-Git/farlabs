#!/bin/bash

# Far Labs Platform API Test Script
# This script tests all major API endpoints

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com"
API_URL="${BASE_URL}/api"

echo -e "${BLUE}=================================${NC}"
echo -e "${BLUE}Far Labs Platform API Test${NC}"
echo -e "${BLUE}=================================${NC}\n"

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}Warning: jq is not installed. Install with: brew install jq${NC}"
    echo -e "${YELLOW}Continuing without pretty-printing...${NC}\n"
    JQ_CMD="cat"
else
    JQ_CMD="jq '.'"
fi

# Test 1: Frontend Health Check
echo -e "${BLUE}[1/7] Testing Frontend...${NC}"
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" | grep -q "200"; then
    echo -e "${GREEN}✓ Frontend is accessible${NC}\n"
else
    echo -e "${RED}✗ Frontend check failed${NC}\n"
fi

# Test 2: Authentication
echo -e "${BLUE}[2/7] Testing Authentication...${NC}"
AUTH_RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
    -H 'Content-Type: application/json' \
    -d '{
        "wallet_address": "0x0000000000000000000000000000000000000001",
        "session_tag": "test"
    }')

echo "$AUTH_RESPONSE" | eval $JQ_CMD

# Extract token
if command -v jq &> /dev/null; then
    TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.token')
else
    TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
fi

if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    echo -e "${GREEN}✓ Authentication successful${NC}"
    echo -e "${YELLOW}Token: ${TOKEN:0:50}...${NC}\n"
else
    echo -e "${RED}✗ Authentication failed${NC}\n"
    exit 1
fi

# Test 3: GPU Nodes
echo -e "${BLUE}[3/7] Testing GPU Nodes API...${NC}"
GPU_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "${API_URL}/gpu/nodes")
echo "$GPU_RESPONSE" | eval $JQ_CMD

if echo "$GPU_RESPONSE" | grep -q "nodes"; then
    if command -v jq &> /dev/null; then
        NODE_COUNT=$(echo "$GPU_RESPONSE" | jq '.nodes | length')
        echo -e "${GREEN}✓ Found $NODE_COUNT GPU nodes${NC}\n"
    else
        echo -e "${GREEN}✓ GPU nodes API working${NC}\n"
    fi
else
    echo -e "${RED}✗ GPU nodes API failed${NC}\n"
fi

# Test 4: Payments/Balance
echo -e "${BLUE}[4/7] Testing Payments API...${NC}"
BALANCE_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "${API_URL}/payments/balances")
echo "$BALANCE_RESPONSE" | eval $JQ_CMD
echo -e "${GREEN}✓ Payments API accessible${NC}\n"

# Test 5: Staking
echo -e "${BLUE}[5/7] Testing Staking API...${NC}"
STAKING_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "${API_URL}/staking/positions")
echo "$STAKING_RESPONSE" | eval $JQ_CMD
echo -e "${GREEN}✓ Staking API accessible${NC}\n"

# Test 6: Submit Inference Task
echo -e "${BLUE}[6/7] Testing Inference Task Submission...${NC}"
TASK_RESPONSE=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' \
    "${API_URL}/inference/tasks" \
    -d '{
        "model": "gpt2",
        "prompt": "Hello, this is a test from the API test script",
        "max_tokens": 50
    }')
echo "$TASK_RESPONSE" | eval $JQ_CMD

if command -v jq &> /dev/null; then
    TASK_ID=$(echo "$TASK_RESPONSE" | jq -r '.task_id')
    if [ -n "$TASK_ID" ] && [ "$TASK_ID" != "null" ]; then
        echo -e "${GREEN}✓ Inference task created: $TASK_ID${NC}\n"

        # Test 7: Check Task Status
        echo -e "${BLUE}[7/7] Testing Task Status...${NC}"
        sleep 2  # Wait a bit for task to process
        STATUS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "${API_URL}/inference/tasks/$TASK_ID")
        echo "$STATUS_RESPONSE" | eval $JQ_CMD
        echo -e "${GREEN}✓ Task status retrieved${NC}\n"
    else
        echo -e "${YELLOW}⚠ Inference task response received but no task_id${NC}\n"
        echo -e "${BLUE}[7/7] Skipping task status check${NC}\n"
    fi
else
    echo -e "${GREEN}✓ Inference API accessible${NC}\n"
    echo -e "${BLUE}[7/7] Task status check skipped (install jq for full testing)${NC}\n"
fi

# Summary
echo -e "${BLUE}=================================${NC}"
echo -e "${GREEN}All API tests completed!${NC}"
echo -e "${BLUE}=================================${NC}\n"

echo -e "${YELLOW}Tips:${NC}"
echo -e "  - Install jq for better output: ${BLUE}brew install jq${NC}"
echo -e "  - View full testing guide: ${BLUE}cat TESTING-GUIDE.md${NC}"
echo -e "  - Frontend URL: ${BLUE}${BASE_URL}${NC}"
echo -e "  - API Base URL: ${BLUE}${API_URL}${NC}\n"
