#!/bin/bash

# Far Labs GPU Worker - Mac M1 Setup Script
# This script automates the setup process for connecting your Mac M1 GPU

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=================================${NC}"
echo -e "${BLUE}Far Labs GPU Worker Setup${NC}"
echo -e "${BLUE}Mac M1/M2/M3 Edition${NC}"
echo -e "${BLUE}=================================${NC}\n"

# Check if we're on Apple Silicon
if [[ $(uname -m) != "arm64" ]]; then
    echo -e "${RED}Error: This script is for Apple Silicon Macs (M1/M2/M3)${NC}"
    echo -e "${RED}Detected architecture: $(uname -m)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Detected Apple Silicon Mac${NC}\n"

# Check Python version
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed${NC}"
    echo -e "${YELLOW}Install from: https://www.python.org/downloads/${NC}"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d ' ' -f 2)
echo -e "${GREEN}✓ Python ${PYTHON_VERSION} found${NC}\n"

# Step 1: Create virtual environment
echo -e "${BLUE}[1/6] Setting up Python virtual environment...${NC}"
if [ -d ".venv" ]; then
    echo -e "${YELLOW}  Virtual environment already exists, skipping...${NC}"
else
    python3 -m venv .venv
    echo -e "${GREEN}  ✓ Virtual environment created${NC}"
fi

# Activate virtual environment
source .venv/bin/activate
echo -e "${GREEN}  ✓ Virtual environment activated${NC}\n"

# Step 2: Install dependencies
echo -e "${BLUE}[2/6] Installing dependencies...${NC}"
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
echo -e "${GREEN}  ✓ Dependencies installed${NC}\n"

# Step 3: Get wallet address
echo -e "${BLUE}[3/6] Configuration${NC}"
read -p "Enter your wallet address (0x...): " WALLET_ADDRESS

if [[ ! $WALLET_ADDRESS =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    echo -e "${YELLOW}Warning: Wallet address format looks unusual${NC}"
    echo -e "${YELLOW}Expected format: 0x followed by 40 hex characters${NC}"
    read -p "Continue anyway? (y/n): " CONTINUE
    if [[ $CONTINUE != "y" ]]; then
        echo -e "${RED}Setup cancelled${NC}"
        exit 1
    fi
fi

# Step 4: Get authentication token
echo -e "\n${BLUE}[4/6] Obtaining authentication token...${NC}"
TOKEN_RESPONSE=$(curl -s -X POST 'http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/auth/login' \
    -H 'Content-Type: application/json' \
    -d "{\"wallet_address\":\"$WALLET_ADDRESS\",\"session_tag\":\"gpu-worker-setup\"}")

if echo "$TOKEN_RESPONSE" | grep -q "token"; then
    if command -v jq &> /dev/null; then
        TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.token')
    else
        TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    fi
    echo -e "${GREEN}  ✓ Authentication successful${NC}"
    echo -e "${YELLOW}  Token: ${TOKEN:0:50}...${NC}\n"
else
    echo -e "${RED}  ✗ Authentication failed${NC}"
    echo -e "${RED}  Response: $TOKEN_RESPONSE${NC}"
    exit 1
fi

# Step 5: Detect hardware
echo -e "${BLUE}[5/6] Detecting hardware...${NC}"

# Detect Mac model
CHIP_NAME=$(sysctl -n machdep.cpu.brand_string)
if [[ $CHIP_NAME == *"M1"* ]]; then
    GPU_MODEL="Apple-M1-GPU"
elif [[ $CHIP_NAME == *"M2"* ]]; then
    GPU_MODEL="Apple-M2-GPU"
elif [[ $CHIP_NAME == *"M3"* ]]; then
    GPU_MODEL="Apple-M3-GPU"
else
    GPU_MODEL="Apple-Silicon-GPU"
fi

# Detect RAM
RAM_GB=$(sysctl -n hw.memsize | awk '{print int($1/1024/1024/1024)}')
VRAM_GB=$RAM_GB  # Unified memory on Apple Silicon

echo -e "${GREEN}  ✓ Detected: $GPU_MODEL${NC}"
echo -e "${GREEN}  ✓ Unified Memory: ${VRAM_GB}GB${NC}\n"

# Ask for location
read -p "Enter your location (e.g., US-California, UK-London): " LOCATION
if [ -z "$LOCATION" ]; then
    LOCATION="Unknown"
fi

# Step 6: Create configuration files
echo -e "${BLUE}[6/6] Creating configuration files...${NC}"

# Create mock mode config (for testing)
cat > .env.local << EOF
# Far Labs GPU Worker Configuration - Mock Mode (Testing)
# Generated: $(date)

# API Configuration
FARLABS_API_BASE_URL=http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com
FARLABS_API_TOKEN=$TOKEN
FARLABS_REDIS_URL=redis://farlabs-redis-free.cc9c2a8ueo1d.us-east-1.rds.amazonaws.com:6379

# Your Wallet
FARLABS_WALLET_ADDRESS=$WALLET_ADDRESS

# Hardware Profile
FARLABS_GPU_MODEL=$GPU_MODEL
FARLABS_VRAM_GB=$VRAM_GB
FARLABS_BANDWIDTH_GBPS=1
FARLABS_LOCATION=$LOCATION

# Mock Executor (for testing)
FARLABS_EXECUTOR=mock
FARLABS_HEARTBEAT_INTERVAL=30

# Enable token refresh
FARLABS_AUTH_REFRESH_ENABLED=true
EOF

echo -e "${GREEN}  ✓ Created .env.local (mock mode for testing)${NC}"

# Create production config (for real inference)
cat > .env.production << EOF
# Far Labs GPU Worker Configuration - Production Mode
# Generated: $(date)

# API Configuration
FARLABS_API_BASE_URL=http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com
FARLABS_API_TOKEN=$TOKEN
FARLABS_REDIS_URL=redis://farlabs-redis-free.cc9c2a8ueo1d.us-east-1.rds.amazonaws.com:6379

# Your Wallet
FARLABS_WALLET_ADDRESS=$WALLET_ADDRESS

# Hardware Profile
FARLABS_GPU_MODEL=$GPU_MODEL
FARLABS_VRAM_GB=$VRAM_GB
FARLABS_BANDWIDTH_GBPS=1
FARLABS_LOCATION=$LOCATION

# HuggingFace Executor (real AI inference)
FARLABS_EXECUTOR=huggingface
FARLABS_EXECUTOR_DEVICE=mps
FARLABS_EXECUTOR_DTYPE=float16
FARLABS_MODEL_CACHE_DIR=$HOME/.cache/farlabs-models

# Model Mapping (start with small models for Mac M1)
FARLABS_EXECUTOR_MODEL_MAP={"gpt2":"gpt2","phi-2":"microsoft/phi-2"}

# Enable token refresh
FARLABS_AUTH_REFRESH_ENABLED=true
FARLABS_HEARTBEAT_INTERVAL=30
EOF

echo -e "${GREEN}  ✓ Created .env.production (real inference)${NC}\n"

# Summary
echo -e "${BLUE}=================================${NC}"
echo -e "${GREEN}✨ Setup Complete!${NC}"
echo -e "${BLUE}=================================${NC}\n"

echo -e "${YELLOW}Your Configuration:${NC}"
echo -e "  Wallet: ${WALLET_ADDRESS}"
echo -e "  GPU: ${GPU_MODEL}"
echo -e "  Memory: ${VRAM_GB}GB"
echo -e "  Location: ${LOCATION}\n"

echo -e "${YELLOW}Next Steps:${NC}\n"

echo -e "${BLUE}1. Test with mock mode (recommended first):${NC}"
echo -e "   ${GREEN}python -m farlabs_gpu_worker run --env-file .env.local${NC}\n"

echo -e "${BLUE}2. Verify your node is registered:${NC}"
echo -e "   ${GREEN}export FAR_TOKEN=\"$TOKEN\"${NC}"
echo -e "   ${GREEN}curl -H \"Authorization: Bearer \$FAR_TOKEN\" \\${NC}"
echo -e "   ${GREEN}  'http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/gpu/nodes'${NC}\n"

echo -e "${BLUE}3. Upgrade to real inference:${NC}"
echo -e "   ${GREEN}python -m farlabs_gpu_worker run --env-file .env.production${NC}\n"

echo -e "${YELLOW}Tip: Press Ctrl+C to stop the worker${NC}"
echo -e "${YELLOW}For 24/7 operation, see: CONNECT-MAC-M1-GPU.md${NC}\n"

# Ask if user wants to start worker now
read -p "Start worker in mock mode now? (y/n): " START_NOW
if [[ $START_NOW == "y" ]]; then
    echo -e "\n${GREEN}Starting worker...${NC}\n"
    python -m farlabs_gpu_worker run --env-file .env.local
fi
