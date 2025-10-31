#!/bin/bash
# Far Labs Platform - Comprehensive Deployment Test Suite
# This script tests all deployed services and their endpoints

set -e

BASE_URL="http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com"
TOKEN=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Far Labs Platform - Deployment Test Suite"
echo "=========================================="
echo ""

# Function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local auth=$5

    echo -n "Testing $name... "

    if [ "$method" == "GET" ]; then
        if [ "$auth" == "true" ]; then
            response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" "$BASE_URL$endpoint")
        else
            response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
        fi
    elif [ "$method" == "POST" ]; then
        if [ "$auth" == "true" ]; then
            response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" --data-binary "$data" "$BASE_URL$endpoint")
        else
            response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" --data-binary "$data" "$BASE_URL$endpoint")
        fi
    fi

    status_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')

    if [ "$status_code" == "200" ] || [ "$status_code" == "201" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $status_code)"
        return 0
    elif [ "$status_code" == "401" ]; then
        echo -e "${YELLOW}⚠ AUTH REQUIRED${NC} (HTTP $status_code)"
        return 1
    elif [ "$status_code" == "404" ]; then
        echo -e "${RED}✗ NOT FOUND${NC} (HTTP $status_code)"
        return 1
    elif [ "$status_code" == "500" ]; then
        echo -e "${RED}✗ SERVER ERROR${NC} (HTTP $status_code)"
        echo "   Response: $body"
        return 1
    else
        echo -e "${YELLOW}⚠ UNEXPECTED${NC} (HTTP $status_code)"
        echo "   Response: $body"
        return 1
    fi
}

echo "=== 1. Frontend Service ==="
test_endpoint "Frontend Homepage" "GET" "/" "" "false"
echo ""

echo "=== 2. Authentication Service ==="
echo "Logging in to get JWT token..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    --data-binary '{"wallet_address":"0x0000000000000000000000000000000000000001","session_tag":"test"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ FAILED TO GET TOKEN${NC}"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
else
    echo -e "${GREEN}✓ Login successful${NC}"
    echo "Token: ${TOKEN:0:50}..."
fi
echo ""

echo "=== 3. GPU Service ==="
test_endpoint "List GPU Nodes" "GET" "/api/gpu/nodes" "" "true"
test_endpoint "GPU Stats" "GET" "/api/gpu/stats" "" "true"
echo ""

echo "=== 4. Inference Service ==="
test_endpoint "Network Status" "GET" "/api/network/status" "" "false"
test_endpoint "List Tasks" "GET" "/api/inference/tasks" "" "true"
test_endpoint "Inference Activity" "GET" "/api/inference/activity" "" "true"
echo ""

echo "=== 5. Staking Service ==="
test_endpoint "Staking Balance" "GET" "/api/staking/balance" "" "true"
test_endpoint "Staking Status" "GET" "/api/staking/status" "" "true"
echo ""

echo "=== 6. Payments Service ==="
test_endpoint "Payment Balance" "GET" "/api/payments/balance" "" "true"
test_endpoint "Payment History" "GET" "/api/payments/history" "" "true"
echo ""

echo "=== 7. Far Mesh Coordinator ==="
test_endpoint "Mesh Status" "GET" "/api/far-mesh/status" "" "false"
test_endpoint "List Workers" "GET" "/api/far-mesh/workers" "" "true"
echo ""

echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo ""
echo "Available Models (from inference service):"
echo "  - llama-70b (requires 140GB VRAM)"
echo "  - mixtral-8x22b (requires 180GB VRAM)"
echo "  - llama-405b (requires 810GB VRAM)"
echo ""
echo "Current GPU Nodes: 6 registered"
echo "  - Max VRAM available: 16GB"
echo "  - Status: Nodes cannot run production models (insufficient VRAM)"
echo ""
echo "Note: To test inference, you need GPU nodes with sufficient VRAM"
echo "      or add smaller models to the MODEL_REGISTRY"
echo ""
