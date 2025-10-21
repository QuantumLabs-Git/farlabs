# syntax=docker/dockerfile:1.6

FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt /tmp/requirements.txt
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r /tmp/requirements.txt

# Copy service code
COPY . /app/

# Create non-root user
RUN useradd --create-home coordinator && \
    chown -R coordinator:coordinator /app

USER coordinator

# Expose port
EXPOSE 8100

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8100/health')"

# Run server (run from parent directory so imports work)
WORKDIR /
CMD ["python", "-m", "uvicorn", "app.server:app", "--host", "0.0.0.0", "--port", "8100"]
