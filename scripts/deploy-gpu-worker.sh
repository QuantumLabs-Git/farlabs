#!/bin/bash
# Deploy Real GPU Inference Worker to EC2 Instance

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <instance-ip>"
    echo "Example: $0 3.94.113.76"
    exit 1
fi

INSTANCE_IP=$1
KEY_FILE="$HOME/.ssh/farlabs-gpu-key.pem"
WORKER_DIR="/home/ubuntu/gpu-worker"

echo "=========================================="
echo "Deploying GPU Inference Worker"
echo "=========================================="
echo "Instance: $INSTANCE_IP"
echo ""

# Wait for instance to be ready
echo "1. Checking if instance is ready..."
for i in {1..30}; do
    if ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no -o ConnectTimeout=5 ubuntu@$INSTANCE_IP "echo ready" &>/dev/null; then
        echo "   ✓ Instance is accessible"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "   ✗ Instance not ready after 5 minutes"
        exit 1
    fi
    echo "   Waiting... ($i/30)"
    sleep 10
done
echo ""

# Check GPU
echo "2. Checking GPU..."
GPU_INFO=$(ssh -i "$KEY_FILE" ubuntu@$INSTANCE_IP "nvidia-smi --query-gpu=name,memory.total --format=csv,noheader" 2>/dev/null || echo "")
if [ -n "$GPU_INFO" ]; then
    echo "   ✓ GPU: $GPU_INFO"
else
    echo "   ⚠ GPU not detected, waiting for drivers..."
    sleep 30
    GPU_INFO=$(ssh -i "$KEY_FILE" ubuntu@$INSTANCE_IP "nvidia-smi --query-gpu=name,memory.total --format=csv,noheader" 2>/dev/null || echo "GPU initializing")
    echo "   Status: $GPU_INFO"
fi
echo ""

# Create worker directory
echo "3. Creating worker directory..."
ssh -i "$KEY_FILE" ubuntu@$INSTANCE_IP "mkdir -p $WORKER_DIR"
echo "   ✓ Directory created"
echo ""

# Copy worker files
echo "4. Copying worker files..."
scp -i "$KEY_FILE" \
    backend/services/gpu_inference_worker/worker.py \
    backend/services/gpu_inference_worker/requirements.txt \
    backend/services/gpu_inference_worker/Dockerfile \
    ubuntu@$INSTANCE_IP:$WORKER_DIR/
echo "   ✓ Files copied"
echo ""

# Build Docker image
echo "5. Building Docker image..."
ssh -i "$KEY_FILE" ubuntu@$INSTANCE_IP "cd $WORKER_DIR && docker build -t farlabs-gpu-worker ."
echo "   ✓ Image built"
echo ""

# Stop existing container if running
echo "6. Stopping existing worker (if any)..."
ssh -i "$KEY_FILE" ubuntu@$INSTANCE_IP "docker stop farlabs-worker 2>/dev/null || true"
ssh -i "$KEY_FILE" ubuntu@$INSTANCE_IP "docker rm farlabs-worker 2>/dev/null || true"
echo "   ✓ Cleaned up"
echo ""

# Run worker with GPU access
echo "7. Starting GPU worker..."
ssh -i "$KEY_FILE" ubuntu@$INSTANCE_IP "docker run -d \
    --name farlabs-worker \
    --gpus all \
    --restart unless-stopped \
    -e REDIS_URL='redis://farlabs-redis-free.b8rw3f.0001.use1.cache.amazonaws.com:6379' \
    farlabs-gpu-worker"
echo "   ✓ Worker started"
echo ""

# Check logs
echo "8. Checking worker logs..."
sleep 5
ssh -i "$KEY_FILE" ubuntu@$INSTANCE_IP "docker logs farlabs-worker --tail 20"
echo ""

echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "GPU Worker is now running on $INSTANCE_IP"
echo ""
echo "To monitor logs:"
echo "  ssh -i $KEY_FILE ubuntu@$INSTANCE_IP 'docker logs -f farlabs-worker'"
echo ""
echo "To check GPU usage:"
echo "  ssh -i $KEY_FILE ubuntu@$INSTANCE_IP 'nvidia-smi'"
echo ""
echo "To stop the worker:"
echo "  ssh -i $KEY_FILE ubuntu@$INSTANCE_IP 'docker stop farlabs-worker'"
echo ""
echo "Cost: ~\$0.16/hour while instance is running"
echo "Remember to terminate the instance when done to stop charges!"
echo ""
