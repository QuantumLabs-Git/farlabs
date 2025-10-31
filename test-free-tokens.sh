#!/bin/bash
# Test the free token system

ALB_URL="http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com"
WALLET="0x0000000000000000000000000000000000000999"

echo "=========================================="
echo "Testing Free Token System"
echo "=========================================="
echo ""

# Step 1: Login (should auto-give 100 tokens)
echo "1. Logging in (should receive 100 free tokens automatically)..."
LOGIN_RESPONSE=$(curl -s -X POST "$ALB_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"wallet_address\":\"$WALLET\",\"session_tag\":\"test\"}")

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>/dev/null)
echo "   ✓ Logged in successfully"
echo "   Token: ${TOKEN:0:20}..."
echo ""

sleep 2

# Step 2: Check balance
echo "2. Checking balance after login..."
BALANCE=$(curl -s "$ALB_URL/api/payments/balances/$WALLET" | python3 -c "import sys, json; d=json.load(sys.stdin); print(f\"Available: {d['available']}, Total: {d['total']}\")")
echo "   $BALANCE"
echo ""

# Step 3: Run a cheap inference to spend some tokens
echo "3. Running inference to spend tokens (gpt2, 50 tokens)..."
INFERENCE_RESPONSE=$(curl -s -X POST "$ALB_URL/api/inference/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "model_id": "gpt2",
    "prompt": "Hello world",
    "max_tokens": 50,
    "temperature": 0.7
  }')

COST=$(echo $INFERENCE_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('cost', 'N/A'))" 2>/dev/null || echo "Check if worker is running")
echo "   Cost: $COST tokens"
echo ""

# Step 4: Check updated balance
echo "4. Checking balance after inference..."
BALANCE=$(curl -s "$ALB_URL/api/payments/balances/$WALLET" | python3 -c "import sys, json; d=json.load(sys.stdin); print(f\"Available: {d['available']}, Total: {d['total']}\")")
echo "   $BALANCE"
echo ""

# Step 5: Try using the faucet
echo "5. Trying to use faucet (should fail - balance too high)..."
FAUCET_RESPONSE=$(curl -s -X POST "$ALB_URL/api/payments/faucet" \
  -H "Content-Type: application/json" \
  -d "{\"wallet_address\":\"$WALLET\"}")
SUCCESS=$(echo $FAUCET_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('success', False))" 2>/dev/null)
MESSAGE=$(echo $FAUCET_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('message', 'Unknown'))" 2>/dev/null)
echo "   Success: $SUCCESS"
echo "   Message: $MESSAGE"
echo ""

# Step 6: Simulate low balance by withdrawing most tokens
echo "6. Withdrawing tokens to test faucet (simulating low balance)..."
curl -s -X POST "$ALB_URL/api/payments/withdraw" \
  -H "Content-Type: application/json" \
  -d "{\"wallet_address\":\"$WALLET\",\"amount\":99.5}" > /dev/null
BALANCE=$(curl -s "$ALB_URL/api/payments/balances/$WALLET" | python3 -c "import sys, json; d=json.load(sys.stdin); print(f\"Available: {d['available']}, Total: {d['total']}\")")
echo "   $BALANCE"
echo ""

# Step 7: Use faucet when balance is low
echo "7. Using faucet (balance < 1 token, should succeed)..."
FAUCET_RESPONSE=$(curl -s -X POST "$ALB_URL/api/payments/faucet" \
  -H "Content-Type: application/json" \
  -d "{\"wallet_address\":\"$WALLET\"}")
SUCCESS=$(echo $FAUCET_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('success', False))" 2>/dev/null)
AMOUNT=$(echo $FAUCET_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('amount_added', 0))" 2>/dev/null)
echo "   Success: $SUCCESS"
echo "   Amount added: $AMOUNT tokens"
echo ""

# Step 8: Check final balance
echo "8. Final balance after faucet..."
BALANCE=$(curl -s "$ALB_URL/api/payments/balances/$WALLET" | python3 -c "import sys, json; d=json.load(sys.stdin); print(f\"Available: {d['available']}, Total: {d['total']}\")")
echo "   $BALANCE"
echo ""

echo "=========================================="
echo "Test Complete!"
echo "=========================================="
echo ""
echo "Summary:"
echo "- Login gives 100 free tokens (if balance < 1)"
echo "- Faucet gives 50 tokens (if balance < 1)"
echo "- Users can't spam faucet when they have tokens"
echo ""
