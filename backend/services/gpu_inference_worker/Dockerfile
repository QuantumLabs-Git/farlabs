FROM nvidia/cuda:12.1.0-runtime-ubuntu22.04

WORKDIR /app

# Install Python
RUN apt-get update && \
    apt-get install -y python3.10 python3-pip && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy worker code
COPY worker.py .

# Set environment
ENV PYTHONUNBUFFERED=1

CMD ["python3", "worker.py"]
