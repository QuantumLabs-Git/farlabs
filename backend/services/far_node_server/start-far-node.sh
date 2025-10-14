#!/bin/bash
# Far Node Server - Quick Start Script
# This script helps GPU providers set up and run their Far Node

set -e

echo "=========================================="
echo "  Far Labs GPU Provider - Node Setup"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "⚠️  Warning: Running as root. Consider using a non-root user."
    echo ""
fi

# Check for NVIDIA GPU
echo "[1/7] Checking for NVIDIA GPU..."
if ! command -v nvidia-smi &> /dev/null; then
    echo "❌ ERROR: nvidia-smi not found!"
    echo "Please install NVIDIA drivers first."
    exit 1
fi

GPU_INFO=$(nvidia-smi --query-gpu=name,memory.total --format=csv,noheader | head -n1)
echo "✓ Found GPU: $GPU_INFO"
echo ""

# Check for Python
echo "[2/7] Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo "❌ ERROR: Python 3 not found!"
    echo "Please install Python 3.10+ first."
    exit 1
fi

PYTHON_VERSION=$(python3 --version)
echo "✓ $PYTHON_VERSION"
echo ""

# Check for pip
echo "[3/7] Checking pip..."
if ! command -v pip3 &> /dev/null; then
    echo "❌ ERROR: pip3 not found!"
    echo "Please install pip first."
    exit 1
fi
echo "✓ pip3 installed"
echo ""

# Prompt for wallet address
echo "[4/7] Configuration"
echo ""
read -p "Enter your Ethereum wallet address (0x...): " WALLET_ADDRESS

if [[ ! $WALLET_ADDRESS =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    echo "❌ ERROR: Invalid Ethereum address format"
    echo "Address should start with 0x and be 42 characters long"
    exit 1
fi

echo "✓ Wallet address: $WALLET_ADDRESS"
echo ""

# Choose model
echo "Which model would you like to serve?"
echo "1) Llama-2-7B (Recommended, ~14GB VRAM)"
echo "2) Llama-2-13B (~26GB VRAM)"
echo "3) Llama-2-70B (Requires multiple GPUs)"
echo ""
read -p "Choice [1-3]: " MODEL_CHOICE

case $MODEL_CHOICE in
    1)
        MODEL_ID="meta-llama/Llama-2-7b-chat-hf"
        ;;
    2)
        MODEL_ID="meta-llama/Llama-2-13b-chat-hf"
        ;;
    3)
        MODEL_ID="meta-llama/Llama-2-70b-chat-hf"
        ;;
    *)
        echo "Invalid choice, using Llama-2-7B"
        MODEL_ID="meta-llama/Llama-2-7b-chat-hf"
        ;;
esac

echo "✓ Selected model: $MODEL_ID"
echo ""

# Ask for public address
read -p "Enter your public IP or domain (or press Enter for auto-detect): " PUBLIC_ADDR
if [ -z "$PUBLIC_ADDR" ]; then
    PUBLIC_ADDR="auto"
fi
echo ""

# Create virtual environment
echo "[5/7] Setting up Python environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✓ Created virtual environment"
else
    echo "✓ Using existing virtual environment"
fi

source venv/bin/activate

# Install dependencies
echo ""
echo "[6/7] Installing dependencies..."
echo "(This may take 5-10 minutes for first-time installation)"
pip install --upgrade pip > /dev/null
pip install -r requirements.txt

echo "✓ Dependencies installed"
echo ""

# Create .env file
echo "[7/7] Creating configuration file..."
cat > .env << EOF
# Far Node Configuration
FAR_NODE_WALLET=$WALLET_ADDRESS
FAR_NODE_MODEL=$MODEL_ID
FAR_NODE_PUBLIC_ADDR=$PUBLIC_ADDR
FAR_NODE_PORT=31330
FAR_NODE_DTYPE=float16

# Far Labs Services
FAR_DISCOVERY_URL=https://discovery.farlabs.ai
FAR_MESH_DHT_BOOTSTRAP=/ip4/discovery.farlabs.ai/tcp/31337
EOF

echo "✓ Configuration saved to .env"
echo ""

echo "=========================================="
echo "  ✓ Setup Complete!"
echo "=========================================="
echo ""
echo "To start your Far Node and begin earning FAR tokens:"
echo ""
echo "  ./run-far-node.sh"
echo ""
echo "Your node will:"
echo "  • Serve model layers for distributed inference"
echo "  • Automatically register with Far Labs"
echo "  • Start earning FAR tokens for every token generated"
echo ""
echo "Monitor your earnings at: https://app.farlabs.ai/provider"
echo ""
echo "⚠️  Important:"
echo "  • Keep this terminal window open while earning"
echo "  • Ensure port 31330 is accessible from the internet"
echo "  • Your GPU will be utilized for serving inference requests"
echo ""
