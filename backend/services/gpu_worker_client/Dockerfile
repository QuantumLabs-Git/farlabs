# syntax=docker/dockerfile:1.6

FROM pytorch/pytorch:2.2.0-cuda12.1-cudnn8-runtime as runtime

ENV PIP_NO_CACHE_DIR=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_EXTRA_INDEX_URL=https://download.pytorch.org/whl/cu121

WORKDIR /app

COPY requirements.txt /tmp/requirements.txt
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r /tmp/requirements.txt

COPY farlabs_gpu_worker /app/farlabs_gpu_worker
COPY README.md /app/README.md

RUN useradd --create-home worker \
    && chown -R worker:worker /app

USER worker

ENV PATH="/home/worker/.local/bin:${PATH}"

ENTRYPOINT ["python", "-m", "farlabs_gpu_worker"]
CMD ["run"]
