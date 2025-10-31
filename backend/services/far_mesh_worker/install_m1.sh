#!/bin/bash
#
# Far Labs GPU Mesh Worker - M1/M2/M3 Mac Installation Script
#
# This script sets up the Far Mesh worker on Apple Silicon Macs
#

set -e

echo "=========================================="
echo "Far Labs - Apple Silicon GPU Worker Setup"
echo "=========================================="
echo ""

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script is for macOS only"
    exit 1
fi

# Check if running on Apple Silicon
ARCH=$(uname -m)
if [[ "$ARCH" != "arm64" ]]; then
    echo "❌ This script requires Apple Silicon (M1/M2/M3)"
    echo "   Detected: $ARCH"
    exit 1
fi

echo "✓ Apple Silicon Mac detected ($ARCH)"
echo ""

# Check Python version
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed"
    echo "   Please install Python 3.10+ from https://www.python.org"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | awk '{print $2}')
echo "✓ Python $PYTHON_VERSION found"
echo ""

# Create virtual environment
echo "Creating Python virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✓ Virtual environment created"
else
    echo "✓ Virtual environment already exists"
fi

# Activate virtual environment
source venv/bin/activate
echo "✓ Virtual environment activated"
echo ""

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip
echo ""

# Install PyTorch with MPS support
echo "Installing PyTorch with Apple Silicon (MPS) support..."
echo "This may take 5-10 minutes..."
pip install torch torchvision torchaudio
echo "✓ PyTorch installed"
echo ""

# Install other dependencies
echo "Installing Far Labs dependencies..."
pip install git+https://github.com/bigscience-workshop/farmesh.git@main
pip install hivemind>=1.1.10
pip install transformers>=4.43.0
pip install accelerate>=0.28.0
pip install httpx>=0.27.0
pip install python-dotenv>=1.0.1
pip install psutil>=5.9.0
pip install web3>=6.15.1
echo "✓ Dependencies installed"
echo ""

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env configuration file..."
    cat > .env << 'EOF'
# Far Labs Configuration
FARLABS_WALLET_ADDRESS=your_wallet_address_here
FARLABS_DHT_BOOTSTRAP=http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com
FARLABS_API_BASE_URL=http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com

# Model Configuration
FARLABS_MODEL_NAME=bigscience/bloom-560m
FARLABS_TORCH_DTYPE=float16
FARLABS_LOCATION=United States

# Optional: Number of blocks to serve (auto-detect if not set)
# FARLABS_NUM_BLOCKS=2

# Heartbeat interval (seconds)
FARLABS_HEARTBEAT_INTERVAL=30
EOF
    echo "✓ Configuration file created: .env"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your wallet address!"
    echo ""
else
    echo "✓ Configuration file exists: .env"
    echo ""
fi

# Test PyTorch MPS
echo "Testing PyTorch MPS backend..."
python3 -c "
import torch
if torch.backends.mps.is_available():
    print('✓ MPS (Apple Silicon GPU) is available and ready!')
    device = torch.device('mps')
    x = torch.ones(1, device=device)
    print(f'✓ Test tensor created on MPS device')
else:
    print('❌ MPS is not available')
    exit(1)
"
echo ""

echo "=========================================="
echo "✓ Installation Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Edit .env and set your FARLABS_WALLET_ADDRESS"
echo "   nano .env"
echo ""
echo "2. Start the Far Mesh worker:"
echo "   source venv/bin/activate"
echo "   python3 main.py"
echo ""
echo "3. Monitor your earnings:"
echo "   http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/gpu"
echo ""
echo "Your M1 Mac will now contribute to the Far Labs network"
echo "and earn $FAR tokens for distributed AI inference!"
echo ""
