"""Far Labs Real GPU Inference Worker
Processes inference tasks using HuggingFace Transformers with GPU acceleration
"""

from __future__ import annotations

import asyncio
import json
import os
import time
from typing import Any, Dict, Optional
import logging

import redis.asyncio as redis
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://farlabs-redis-free.b8rw3f.0001.use1.cache.amazonaws.com:6379")
QUEUE_KEY = "inference_queue"
TASK_CHANNEL_TEMPLATE = "task:{task_id}"

# Model cache
loaded_models: Dict[str, Any] = {}


def load_model(model_id: str, model_path: str) -> tuple:
    """Load model and tokenizer, cache them"""
    if model_id in loaded_models:
        logger.info(f"Using cached model: {model_id}")
        return loaded_models[model_id]

    logger.info(f"Loading model: {model_id} from {model_path}")
    start_time = time.time()

    device = "cuda" if torch.cuda.is_available() else "cpu"
    logger.info(f"Using device: {device}")

    try:
        tokenizer = AutoTokenizer.from_pretrained(model_path)
        model = AutoModelForCausalLM.from_pretrained(
            model_path,
            torch_dtype=torch.float16 if device == "cuda" else torch.float32,
            device_map="auto" if device == "cuda" else None,
            low_cpu_mem_usage=True
        )

        if device == "cpu":
            model = model.to(device)

        # Create pipeline for easier inference
        pipe = pipeline(
            "text-generation",
            model=model,
            tokenizer=tokenizer,
            device=0 if device == "cuda" else -1
        )

        load_time = time.time() - start_time
        logger.info(f"✓ Model {model_id} loaded in {load_time:.2f}s")

        loaded_models[model_id] = (pipe, tokenizer)
        return pipe, tokenizer

    except Exception as e:
        logger.error(f"Failed to load model {model_id}: {e}")
        raise


async def run_inference(task: Dict[str, Any]) -> Dict[str, Any]:
    """Run actual inference using HuggingFace models"""
    model_id = task.get("model", "gpt2")
    prompt = task.get("prompt", "")
    max_tokens = task.get("max_tokens", 50)
    temperature = task.get("temperature", 0.7)

    # Map model IDs to HuggingFace paths
    model_paths = {
        "gpt2": "gpt2",
        "gpt2-medium": "gpt2-medium",
        "distilgpt2": "distilgpt2",
        "tinyllama": "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
        "phi-2": "microsoft/phi-2",
        "llama-7b": "meta-llama/Llama-2-7b-chat-hf",
    }

    model_path = model_paths.get(model_id, "gpt2")

    try:
        # Load model (or get from cache)
        pipe, tokenizer = await asyncio.to_thread(load_model, model_id, model_path)

        # Run inference
        logger.info(f"Running inference for task {task.get('task_id')}")
        start_time = time.time()

        result = await asyncio.to_thread(
            pipe,
            prompt,
            max_new_tokens=max_tokens,
            temperature=temperature,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id
        )

        inference_time = time.time() - start_time
        generated_text = result[0]["generated_text"]

        # Calculate tokens (approximate)
        tokens_generated = len(tokenizer.encode(generated_text)) - len(tokenizer.encode(prompt))
        tokens_per_second = int(tokens_generated / inference_time) if inference_time > 0 else 0

        logger.info(f"✓ Inference complete: {tokens_generated} tokens in {inference_time:.2f}s ({tokens_per_second} tok/s)")

        return {
            "status": "completed",
            "text": generated_text,
            "tokens_generated": tokens_generated,
            "tokens_per_second": tokens_per_second,
            "inference_time": round(inference_time, 3),
            "accuracy": 1.0,  # Real model
        }

    except Exception as e:
        logger.error(f"Inference failed: {e}")
        return {
            "status": "failed",
            "error": str(e),
            "text": "",
            "tokens_generated": 0,
        }


async def publish_progress(client: redis.Redis, task_id: str, payload: Dict[str, Any]) -> None:
    """Publish task progress to Redis pub/sub"""
    channel = TASK_CHANNEL_TEMPLATE.format(task_id=task_id)
    await client.publish(channel, json.dumps(payload))


async def handle_task(client: redis.Redis, task: Dict[str, Any]) -> None:
    """Process a single inference task"""
    task_id = task.get("task_id")
    if not task_id:
        return

    logger.info(f"Processing task {task_id}")

    # Send progress update
    await publish_progress(
        client,
        task_id,
        {
            "status": "running",
            "message": "Task accepted by GPU worker",
            "node_id": task.get("node_id")
        },
    )

    # Run inference
    result = await run_inference(task)

    # Publish result
    await publish_progress(client, task_id, result)
    logger.info(f"✓ Task {task_id} completed")


async def worker() -> None:
    """Main worker loop"""
    client = redis.from_url(REDIS_URL, decode_responses=True)

    logger.info("===========================================")
    logger.info("Far Labs GPU Inference Worker Starting")
    logger.info("===========================================")
    logger.info(f"Redis: {REDIS_URL}")
    logger.info(f"GPU Available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        logger.info(f"GPU: {torch.cuda.get_device_name(0)}")
        logger.info(f"VRAM: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")
    logger.info("===========================================")
    logger.info("")

    try:
        while True:
            try:
                # Block until task available (timeout 5 seconds)
                result = await asyncio.wait_for(
                    client.brpop(QUEUE_KEY),
                    timeout=5.0
                )
                if result:
                    _, raw = result
                    task = json.loads(raw)
                    await handle_task(client, task)

            except asyncio.TimeoutError:
                # No task available, continue waiting
                continue
            except (redis.ConnectionError, redis.TimeoutError) as e:
                logger.error(f"Redis connection error: {e}")
                await asyncio.sleep(5)
                continue
            except json.JSONDecodeError as e:
                logger.error(f"Invalid task JSON: {e}")
                continue
            except Exception as e:
                logger.error(f"Unexpected error: {e}")
                await asyncio.sleep(1)
                continue

    finally:
        await client.close()


def main() -> None:
    """Entry point"""
    asyncio.run(worker())


if __name__ == "__main__":
    main()
