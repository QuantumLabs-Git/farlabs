#!/bin/bash
# Test Inference Service with New Models

BASE_URL="http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com"

echo "=========================================="
echo "Testing Inference Service - Small Models"
echo "=========================================="
echo ""

# Login to get token
echo "1. Authenticating..."
LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"wallet_address":"0x0000000000000000000000000000000000000001","session_tag":"inference-test"}')
TOKEN=$(echo $LOGIN | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get authentication token"
    exit 1
fi
echo "✓ Authenticated successfully"
echo ""

# Check network status
echo "2. Checking network status..."
NETWORK=$(curl -s "$BASE_URL/api/network/status" -H "Authorization: Bearer $TOKEN" 2>&1)
if echo "$NETWORK" | grep -q "total_nodes"; then
    echo "$NETWORK" | grep -o '"total_nodes":[^,]*' | sed 's/"//g'
    echo "$NETWORK" | grep -o '"available_nodes":[^,]*' | sed 's/"//g'
    echo "$NETWORK" | grep -o '"models_available":\[[^]]*\]'
else
    echo "⚠ Network status endpoint returned: $NETWORK"
fi
echo ""

# Test inference with distilgpt2 (smallest model)
echo "3. Testing inference with distilgpt2 model..."
INFERENCE_RESULT=$(curl -s -X POST "$BASE_URL/api/inference/generate" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "model_id": "distilgpt2",
        "prompt": "Hello, how are you?",
        "max_tokens": 50,
        "temperature": 0.7
    }' 2>&1)

echo "$INFERENCE_RESULT"
echo ""

# Test with gpt2 model
echo "4. Testing inference with gpt2 model..."
INFERENCE_RESULT2=$(curl -s -X POST "$BASE_URL/api/inference/generate" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "model_id": "gpt2",
        "prompt": "The future of AI is",
        "max_tokens": 30,
        "temperature": 0.7
    }' 2>&1)

echo "$INFERENCE_RESULT2"
echo ""

echo "=========================================="
echo "Test Complete"
echo "=========================================="
