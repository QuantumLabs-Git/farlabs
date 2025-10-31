FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Pre-download distilgpt2 model to avoid runtime downloads
RUN python3 -c "from transformers import AutoModelForCausalLM, AutoTokenizer; \
    print('Downloading distilgpt2 model...'); \
    AutoTokenizer.from_pretrained('distilgpt2'); \
    AutoModelForCausalLM.from_pretrained('distilgpt2'); \
    print('Model downloaded successfully')"

COPY . .

CMD ["python", "main.py"]
