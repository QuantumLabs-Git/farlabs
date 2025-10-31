#!/bin/bash
# Manage GPU Instance - Start, Stop, Status, Connect

REGION="us-east-1"

function show_usage() {
    echo "Usage: $0 {status|connect|stop|logs|cost}"
    echo ""
    echo "Commands:"
    echo "  status   - Show instance status and IP"
    echo "  connect  - SSH into the instance"
    echo "  stop     - Terminate the instance (stop charges)"
    echo "  logs     - View worker logs"
    echo "  cost     - Show cost estimate"
    exit 1
}

function get_instance_id() {
    aws ec2 describe-instances \
        --region $REGION \
        --filters "Name=tag:Name,Values=farlabs-gpu-worker" "Name=instance-state-name,Values=running,pending" \
        --query 'Reservations[0].Instances[0].InstanceId' \
        --output text 2>/dev/null
}

function get_instance_ip() {
    local INSTANCE_ID=$1
    aws ec2 describe-instances \
        --region $REGION \
        --instance-ids "$INSTANCE_ID" \
        --query 'Reservations[0].Instances[0].PublicIpAddress' \
        --output text 2>/dev/null
}

case "$1" in
    status)
        INSTANCE_ID=$(get_instance_id)
        if [ "$INSTANCE_ID" == "None" ] || [ -z "$INSTANCE_ID" ]; then
            echo "No GPU instance running"
            echo ""
            echo "To launch: ./scripts/launch-gpu-spot-instance.sh"
            exit 0
        fi

        PUBLIC_IP=$(get_instance_ip "$INSTANCE_ID")
        STATE=$(aws ec2 describe-instances --region $REGION --instance-ids "$INSTANCE_ID" --query 'Reservations[0].Instances[0].State.Name' --output text)
        UPTIME=$(aws ec2 describe-instances --region $REGION --instance-ids "$INSTANCE_ID" --query 'Reservations[0].Instances[0].LaunchTime' --output text)

        echo "=========================================="
        echo "GPU Instance Status"
        echo "=========================================="
        echo "Instance ID: $INSTANCE_ID"
        echo "State: $STATE"
        echo "Public IP: $PUBLIC_IP"
        echo "Launch Time: $UPTIME"
        echo "Type: g4dn.xlarge (NVIDIA T4)"
        echo "Cost: ~\$0.16/hour"
        echo ""
        ;;

    connect)
        INSTANCE_ID=$(get_instance_id)
        if [ "$INSTANCE_ID" == "None" ] || [ -z "$INSTANCE_ID" ]; then
            echo "No GPU instance running"
            exit 1
        fi

        PUBLIC_IP=$(get_instance_ip "$INSTANCE_ID")
        KEY_FILE="$HOME/.ssh/farlabs-gpu-key.pem"

        echo "Connecting to $PUBLIC_IP..."
        ssh -i "$KEY_FILE" ubuntu@$PUBLIC_IP
        ;;

    logs)
        INSTANCE_ID=$(get_instance_id)
        if [ "$INSTANCE_ID" == "None" ] || [ -z "$INSTANCE_ID" ]; then
            echo "No GPU instance running"
            exit 1
        fi

        PUBLIC_IP=$(get_instance_ip "$INSTANCE_ID")
        KEY_FILE="$HOME/.ssh/farlabs-gpu-key.pem"

        echo "Fetching logs from $PUBLIC_IP..."
        ssh -i "$KEY_FILE" ubuntu@$PUBLIC_IP "docker logs -f farlabs-worker"
        ;;

    stop)
        INSTANCE_ID=$(get_instance_id)
        if [ "$INSTANCE_ID" == "None" ] || [ -z "$INSTANCE_ID" ]; then
            echo "No GPU instance running"
            exit 0
        fi

        echo "Terminating instance $INSTANCE_ID..."
        aws ec2 terminate-instances --region $REGION --instance-ids "$INSTANCE_ID"
        echo "✓ Instance terminating (charges will stop)"
        ;;

    cost)
        INSTANCE_ID=$(get_instance_id)
        if [ "$INSTANCE_ID" == "None" ] || [ -z "$INSTANCE_ID" ]; then
            echo "No GPU instance running - $0 cost"
            exit 0
        fi

        UPTIME=$(aws ec2 describe-instances --region $REGION --instance-ids "$INSTANCE_ID" --query 'Reservations[0].Instances[0].LaunchTime' --output text)
        LAUNCH_EPOCH=$(date -j -f "%Y-%m-%dT%H:%M:%S" "${UPTIME:0:19}" +%s 2>/dev/null || date -d "$UPTIME" +%s)
        NOW_EPOCH=$(date +%s)
        HOURS_RUNNING=$(echo "scale=2; ($NOW_EPOCH - $LAUNCH_EPOCH) / 3600" | bc)
        COST=$(echo "scale=2; $HOURS_RUNNING * 0.16" | bc)

        echo "=========================================="
        echo "Cost Estimate"
        echo "=========================================="
        echo "Hours Running: $HOURS_RUNNING"
        echo "Estimated Cost: \$${COST}"
        echo "Rate: \$0.16/hour"
        echo ""
        echo "Note: Actual cost may vary based on spot pricing"
        ;;

    *)
        show_usage
        ;;
esac
