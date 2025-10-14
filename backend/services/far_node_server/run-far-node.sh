#!/bin/bash
# Run Far Node Server

set -e

# Activate virtual environment
if [ ! -d "venv" ]; then
    echo "❌ ERROR: Virtual environment not found!"
    echo "Please run ./start-far-node.sh first to set up your node."
    exit 1
fi

source venv/bin/activate

# Load environment variables
if [ ! -f ".env" ]; then
    echo "❌ ERROR: Configuration file (.env) not found!"
    echo "Please run ./start-far-node.sh first to configure your node."
    exit 1
fi

export $(cat .env | grep -v '^#' | xargs)

# Validate configuration
if [ -z "$FAR_NODE_WALLET" ]; then
    echo "❌ ERROR: FAR_NODE_WALLET not set in .env"
    exit 1
fi

echo "=========================================="
echo "  Starting Far Node Server"
echo "=========================================="
echo ""
echo "Wallet: $FAR_NODE_WALLET"
echo "Model: $FAR_NODE_MODEL"
echo "Port: $FAR_NODE_PORT"
echo ""
echo "Press Ctrl+C to stop earning and shutdown gracefully"
echo ""
echo "=========================================="
echo ""

# Run the node server
python3 node_server.py
