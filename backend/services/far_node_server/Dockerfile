FROM nvidia/cuda:12.1.0-cudnn8-runtime-ubuntu22.04

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3.10 \
    python3-pip \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip
RUN pip3 install --no-cache-dir --upgrade pip

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy application code
COPY node_server.py .
COPY main.py .
COPY .env.example .env.example

# Create directories for caching
RUN mkdir -p /root/.cache/huggingface
RUN mkdir -p /root/.cache/torch

# Expose FarMesh P2P port (default)
EXPOSE 31330

# Health check - ensure process is running
HEALTHCHECK --interval=60s --timeout=10s --start-period=120s --retries=3 \
  CMD pgrep -f "python3 main.py" > /dev/null || exit 1

# Run the node server
CMD ["python3", "main.py"]
