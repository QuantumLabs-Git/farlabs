#!/bin/bash
# Launch AWS EC2 GPU Spot Instance for Real AI Inference
# Instance: g4dn.xlarge with NVIDIA T4 GPU (16GB VRAM)
# Cost: ~$0.16/hour spot pricing

set -e

REGION="us-east-1"
INSTANCE_TYPE="g4dn.xlarge"
AMI_ID="ami-06ff80767cf0e0ab5"  # Deep Learning AMI (Ubuntu 22.04) with GPU drivers pre-installed
KEY_NAME="farlabs-gpu-key"
SECURITY_GROUP="sg-0bdbd024ea8893873"  # Same as ECS services
SUBNET_ID="subnet-0298cae01864340b9"  # Same subnet as ECS
MAX_PRICE="0.25"  # Max $0.25/hour (spot price is usually ~$0.16)

echo "=========================================="
echo "Launching GPU Spot Instance for Far Labs"
echo "=========================================="
echo ""
echo "Instance Type: $INSTANCE_TYPE"
echo "GPU: NVIDIA T4 (16GB VRAM)"
echo "Max Spot Price: \$${MAX_PRICE}/hour"
echo "Region: $REGION"
echo ""

# Check if key pair exists, create if not
echo "1. Checking SSH key pair..."
if ! aws ec2 describe-key-pairs --key-names "$KEY_NAME" --region $REGION &>/dev/null; then
    echo "   Creating new key pair: $KEY_NAME"
    aws ec2 create-key-pair \
        --key-name "$KEY_NAME" \
        --region $REGION \
        --query 'KeyMaterial' \
        --output text > ~/.ssh/${KEY_NAME}.pem
    chmod 400 ~/.ssh/${KEY_NAME}.pem
    echo "   ✓ Key saved to ~/.ssh/${KEY_NAME}.pem"
else
    echo "   ✓ Key pair already exists"
fi
echo ""

# Create user data script for automatic setup
echo "2. Preparing instance user data..."
cat > /tmp/gpu-userdata.sh <<'EOF'
#!/bin/bash
# Automatic GPU Instance Setup

set -e

echo "Starting GPU worker setup..." > /var/log/gpu-setup.log

# Update system
apt-get update >> /var/log/gpu-setup.log 2>&1

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh >> /var/log/gpu-setup.log 2>&1
fi

# Install NVIDIA Container Toolkit (for GPU access in Docker)
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.list | \
    sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
    tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

apt-get update >> /var/log/gpu-setup.log 2>&1
apt-get install -y nvidia-container-toolkit >> /var/log/gpu-setup.log 2>&1
systemctl restart docker >> /var/log/gpu-setup.log 2>&1

# Test GPU access
nvidia-smi > /var/log/gpu-test.log 2>&1

echo "GPU worker setup complete!" >> /var/log/gpu-setup.log
echo "Ready for deployment" > /var/log/gpu-ready
EOF

echo "   ✓ User data script created"
echo ""

# Encode user data (macOS compatible)
USER_DATA_ENCODED=$(cat /tmp/gpu-userdata.sh | base64)

# Launch spot instance
echo "3. Launching spot instance..."
SPOT_REQUEST=$(aws ec2 request-spot-instances \
    --region $REGION \
    --spot-price "$MAX_PRICE" \
    --instance-count 1 \
    --type "one-time" \
    --launch-specification "{
        \"ImageId\": \"$AMI_ID\",
        \"InstanceType\": \"$INSTANCE_TYPE\",
        \"KeyName\": \"$KEY_NAME\",
        \"SecurityGroupIds\": [\"$SECURITY_GROUP\"],
        \"SubnetId\": \"$SUBNET_ID\",
        \"UserData\": \"$USER_DATA_ENCODED\",
        \"BlockDeviceMappings\": [{
            \"DeviceName\": \"/dev/sda1\",
            \"Ebs\": {
                \"VolumeSize\": 100,
                \"VolumeType\": \"gp3\",
                \"DeleteOnTermination\": true
            }
        }]
    }" \
    --output json)

SPOT_REQUEST_ID=$(echo "$SPOT_REQUEST" | jq -r '.SpotInstanceRequests[0].SpotInstanceRequestId')
echo "   Spot Request ID: $SPOT_REQUEST_ID"
echo "   Waiting for instance to launch (this may take 1-2 minutes)..."
echo ""

# Wait for spot request to be fulfilled
aws ec2 wait spot-instance-request-fulfilled \
    --region $REGION \
    --spot-instance-request-ids "$SPOT_REQUEST_ID"

# Get instance ID
INSTANCE_ID=$(aws ec2 describe-spot-instance-requests \
    --region $REGION \
    --spot-instance-request-ids "$SPOT_REQUEST_ID" \
    --query 'SpotInstanceRequests[0].InstanceId' \
    --output text)

echo "   ✓ Instance launched: $INSTANCE_ID"
echo ""

# Wait for instance to be running
echo "4. Waiting for instance to be running..."
aws ec2 wait instance-running --region $REGION --instance-ids "$INSTANCE_ID"
echo "   ✓ Instance is running"
echo ""

# Tag the instance (can't do in spot request)
aws ec2 create-tags \
    --region $REGION \
    --resources "$INSTANCE_ID" \
    --tags \
        Key=Name,Value=farlabs-gpu-worker \
        Key=Project,Value=FarLabs \
        Key=Type,Value=GPU-Inference

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
    --region $REGION \
    --instance-ids "$INSTANCE_ID" \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

echo "=========================================="
echo "GPU Instance Ready!"
echo "=========================================="
echo ""
echo "Instance ID: $INSTANCE_ID"
echo "Public IP: $PUBLIC_IP"
echo "Instance Type: $INSTANCE_TYPE"
echo "GPU: NVIDIA T4 (16GB VRAM)"
echo "Cost: ~\$0.16/hour"
echo ""
echo "Next steps:"
echo "1. Wait 2-3 minutes for instance to complete setup"
echo "2. Connect via SSH:"
echo "   ssh -i ~/.ssh/${KEY_NAME}.pem ubuntu@${PUBLIC_IP}"
echo ""
echo "3. Deploy the inference worker:"
echo "   ./scripts/deploy-gpu-worker.sh $PUBLIC_IP"
echo ""
echo "To stop the instance (stop charges):"
echo "   aws ec2 terminate-instances --instance-ids $INSTANCE_ID --region $REGION"
echo ""

# Save instance info
cat > /tmp/gpu-instance-info.txt <<ENDINFO
Instance ID: $INSTANCE_ID
Public IP: $PUBLIC_IP
Spot Request ID: $SPOT_REQUEST_ID
Region: $REGION
Key: ~/.ssh/${KEY_NAME}.pem
ENDINFO

echo "Instance info saved to: /tmp/gpu-instance-info.txt"
