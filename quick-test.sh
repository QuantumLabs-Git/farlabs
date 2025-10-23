#!/bin/bash

# Quick test script - Just the essentials
# Run this to quickly verify the platform is working

set -e

BASE_URL="http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com"

echo "🚀 Quick Far Labs Platform Test"
echo "================================"
echo ""

# Test 1: Frontend
echo "1️⃣  Testing Frontend..."
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" | grep -q "200"; then
    echo "   ✅ Frontend is UP"
else
    echo "   ❌ Frontend is DOWN"
fi

# Test 2: Auth
echo "2️⃣  Testing Authentication..."
AUTH=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
    -H 'Content-Type: application/json' \
    -d '{"wallet_address":"0x0000000000000000000000000000000000000001","session_tag":"test"}')

if echo "$AUTH" | grep -q "token"; then
    echo "   ✅ Authentication is WORKING"

    # Extract token
    if command -v jq &> /dev/null; then
        TOKEN=$(echo "$AUTH" | jq -r '.token')
    else
        TOKEN=$(echo "$AUTH" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    fi

    # Test 3: GPU Nodes
    echo "3️⃣  Testing GPU Nodes API..."
    NODES=$(curl -s -H "Authorization: Bearer $TOKEN" "${BASE_URL}/api/gpu/nodes")

    if echo "$NODES" | grep -q "nodes"; then
        if command -v jq &> /dev/null; then
            COUNT=$(echo "$NODES" | jq '.nodes | length')
            echo "   ✅ GPU Nodes API is WORKING ($COUNT nodes registered)"
        else
            echo "   ✅ GPU Nodes API is WORKING"
        fi
    else
        echo "   ❌ GPU Nodes API failed"
    fi
else
    echo "   ❌ Authentication FAILED"
fi

echo ""
echo "================================"
echo "✨ Quick test complete!"
echo ""
echo "For detailed testing, run: ./test-api.sh"
echo "View frontend at: $BASE_URL"
echo ""
