#!/bin/bash
# Test inference with active worker

BASE_URL="http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com"

echo "Testing inference with active worker..."
echo ""

# Get token
echo "1. Getting auth token..."
TOKEN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"wallet_address":"0x0000000000000000000000000000000000000001","session_tag":"test"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")

echo "✓ Token: ${TOKEN:0:40}..."
echo ""

# Test inference
echo "2. Submitting inference request (gpt2 model)..."
echo "   Prompt: 'The future of AI is'"
echo "   Max tokens: 30"
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL/api/inference/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model_id": "gpt2",
    "prompt": "The future of AI is",
    "max_tokens": 30,
    "temperature": 0.7
  }')

echo "Response:"
echo "$RESPONSE" | python3 -m json.tool
echo ""

# Test another model
echo "3. Testing distilgpt2 model..."
RESPONSE2=$(curl -s -X POST "$BASE_URL/api/inference/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model_id": "distilgpt2",
    "prompt": "Hello, how are you?",
    "max_tokens": 20,
    "temperature": 0.7
  }')

echo "Response:"
echo "$RESPONSE2" | python3 -m json.tool
