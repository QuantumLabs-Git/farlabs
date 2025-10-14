FROM nvidia/cuda:12.1.0-cudnn8-runtime-ubuntu22.04

# Set working directory
WORKDIR /app

# Install Python and dependencies
RUN apt-get update && apt-get install -y \
    python3.10 \
    python3-pip \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy application code
COPY main.py .
COPY .env.example .env.example

# Create directory for model cache
RUN mkdir -p /root/.cache/huggingface

# Expose Petals P2P port
EXPOSE 31337

# Run the worker
CMD ["python3", "main.py"]
