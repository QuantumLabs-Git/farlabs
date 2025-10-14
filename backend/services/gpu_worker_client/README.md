# Far Labs GPU Worker Client (Prototype)

This prototype lets independent GPU providers attach their hardware to the Far Labs inference mesh.
It mirrors the behaviour of the in-cluster `inference_worker` but is designed to run on provider
machines with their own GPUs.

## Capabilities

* Registers (or reuses) a GPU node record via the existing `/api/gpu/nodes` endpoint.
* Maintains heartbeats so the control plane can track availability, uptime, and completed tasks.
* Listens for inference tasks from Redis queues, restricted to tasks that match the worker's node id.
* Streams realtime task status updates (token deltas) over the standard `task:{task_id}` pub/sub
  channel and reports latest latency/tokens-per-second in heartbeats.
* Executes prompts through a pluggable executor abstraction. Two backends are available today:
  * `mock` — synthetic completions for smoke testing.
  * `huggingface` — runs prompts through Hugging Face transformers on the provider's GPU.
* Publishes final inference results back into Redis so users receive completions and billing stays
  accurate.

## Quick start

```bash
cd backend/services/gpu_worker_client
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

> **Note:** The Hugging Face executor depends on GPU-aware builds of `torch` and may require
> installing the appropriate wheel for your CUDA runtime.

### Docker quick start

To build a GPU-ready container (requires Docker and the NVIDIA runtime):

```bash
cd backend/services/gpu_worker_client
docker build -t farlabs/gpu-worker:latest .
```

Run the worker with your environment file:

```bash
docker run --rm \
  --gpus all \
  --env-file .env \
  farlabs/gpu-worker:latest
```

Override the command if needed, e.g. `docker run … farlabs/gpu-worker:latest run`.

Export the minimum environment required:

```bash
export FARLABS_API_BASE_URL="http://localhost:8000"
export FARLABS_API_TOKEN="eyJhbGciOi..."      # JWT with `sub` = provider wallet/address
export FARLABS_REDIS_URL="redis://localhost:6379"
export FARLABS_WALLET_ADDRESS="0xabc123..."

# Hardware profile (only required on the first run when registering a node)
export FARLABS_GPU_MODEL="NVIDIA RTX 4090"
export FARLABS_VRAM_GB="24"
export FARLABS_BANDWIDTH_GBPS="10"
export FARLABS_LOCATION="US-East"
```

Then launch the worker:

```bash
python -m farlabs_gpu_worker run
```

The worker will:

1. Register the GPU if `FARLABS_NODE_ID` is not supplied.
2. Start sending heartbeats every 30 seconds.
3. Block on the inference queue until the control plane assigns tasks to this node.
4. Publish task progress updates (`running` → `completed` or `failed`) via Redis pub/sub.

## Configuration reference

| Env var | Default | Description |
| --- | --- | --- |
| `FARLABS_API_BASE_URL` | `http://127.0.0.1:8000` | API Gateway base URL. |
| `FARLABS_API_TOKEN` | _required_ | Bearer token used for GPU and inference APIs. |
| `FARLABS_REDIS_URL` | `redis://localhost:6379` | Redis instance that holds queues and pub/sub. |
| `FARLABS_NODE_ID` | _(optional)_ | Pre-existing node id to reuse instead of registering. |
| `FARLABS_WALLET_ADDRESS` | _required_ | Wallet address that will receive payouts. |
| `FARLABS_GPU_MODEL` | _required if registering_ | GPU model string persisted with the node. |
| `FARLABS_VRAM_GB` | _required if registering_ | Available VRAM (GB). |
| `FARLABS_BANDWIDTH_GBPS` | `1` | Upstream bandwidth capacity. |
| `FARLABS_LOCATION` | `Unknown` | Human-readable location. |
| `FARLABS_NOTES` | `""` | Optional notes stored with the node. |
| `FARLABS_HEARTBEAT_INTERVAL` | `30` | Seconds between heartbeat updates. |
| `FARLABS_QUEUE_NAME` | `inference_queue` | Primary queue name used by the control plane. |
| `FARLABS_QUEUE_BACKOFF_SECONDS` | `1.5` | Delay before re-attempting a task that belongs to a different node. |
| `FARLABS_EXECUTOR` | `mock` | Execution backend (`mock` or `huggingface`). |
| `FARLABS_EXECUTOR_DEVICE` | `auto` | Device placement passed to `transformers.pipeline` (`auto`, `cuda`, `cuda:0`, …). |
| `FARLABS_EXECUTOR_DTYPE` | _(optional)_ | Torch dtype hint (`float16`, `bfloat16`, `float32`). |
| `FARLABS_EXECUTOR_MODEL_MAP` | defaults to Far Labs registry | JSON map of Far Labs model ids → Hugging Face repos. |
| `FARLABS_MODEL_CACHE_DIR` | _(optional)_ | Location to cache downloaded model weights. |
| `FARLABS_TRUST_REMOTE_CODE` | `False` | Set `True` to allow custom model code (mirrors HF `trust_remote_code`). |
| `FARLABS_API_TIMEOUT_SECONDS` | `15` | HTTP timeout when talking to the control plane. |
| `FARLABS_API_VERIFY_TLS` | `True` | Disable only for trusted dev setups; enables HTTPS verification. |
| `FARLABS_API_CA_BUNDLE` | _(optional)_ | Path to custom CA bundle if required. |
| `FARLABS_AUTH_REFRESH_ENABLED` | `False` | When `True`, auto-refreshes tokens via `/api/auth/login`. |
| `FARLABS_AUTH_REFRESH_ENDPOINT` | `/api/auth/login` | Endpoint used for token refresh. |
| `FARLABS_AUTH_REFRESH_LEEWAY_SECONDS` | `60` | Seconds before expiry to trigger refresh. |

## Architecture overview

```
┌───────────────────┐
│ Platform API      │◀───┐
└──────┬────────────┘    │  REST (register + heartbeat)
       │                 │
┌──────▼────────────┐    │
│ GPU Worker Client │────┘
└──────┬────────────┘
       │ Redis (queue + pub/sub)
┌──────▼────────────┐
│ Redis             │
│  - inference_queue│
│  - task:{task_id} │
└───────────────────┘
```

* **Registration & Heartbeats** — handled over HTTPS via the API Gateway using the same endpoints
  the frontend relies on.
* **Task Assignment** — each node has a dedicated Redis list `inference_queue:{node_id}` populated by
  the control plane (alongside the shared `inference_queue` for backwards compatibility).
* **Execution** — choose the default `mock` executor for smoke testing or the `huggingface` backend
  to run real models on the provider GPU.

## Extending the executor

Implement a subclass of `BaseExecutor` in `farlabs_gpu_worker.executor`:

```python
from farlabs_gpu_worker.executor import BaseExecutor, ExecutionResult

class HuggingFaceExecutor(BaseExecutor):
    async def execute(self, task):
        response = await self._pipeline(task["prompt"], ...)
        return ExecutionResult(
            status="completed",
            text=response[0]["generated_text"],
            tokens_generated=<int>,
            tokens_per_second=<float>,
            accuracy=0.0,
        )
```

Register it in `EXECUTOR_IMPLEMENTATIONS` and use `FARLABS_EXECUTOR=huggingface`.

## Using the Hugging Face executor

Set `FARLABS_EXECUTOR=huggingface` and provide any custom model overrides via
`FARLABS_EXECUTOR_MODEL_MAP`. The worker ships with sensible defaults that match the control-plane
registry (`llama-70b`, `mixtral-8x22b`, `llama-405b`). Example environment:

```bash
export FARLABS_EXECUTOR=huggingface
export FARLABS_EXECUTOR_DEVICE="cuda"
export FARLABS_EXECUTOR_DTYPE="bfloat16"
export FARLABS_MODEL_CACHE_DIR="$HOME/.cache/farlabs-models"
export FARLABS_EXECUTOR_MODEL_MAP='{"custom-model":"org/custom-7b"}'
```

When the worker receives a task for `custom-model`, it will load `org/custom-7b` from Hugging Face
and execute it on the local GPU. All downloads respect the optional cache directory. While
generating, the worker emits incremental `{delta, tokens_generated}` messages so downstream clients
can stream the completion in real time; the final event includes aggregate latency and
tokens-per-second.

### Token refresh

In production, set `FARLABS_AUTH_REFRESH_ENABLED=true` so the worker periodically calls the control
plane (default `POST /api/auth/login`) to renew its bearer token before expiry. You can override the
endpoint or leeway via the matching environment variables listed above. For development with
manually minted tokens, leave refresh disabled.

## Deployment checklist

- **GPU runtime**: Install recent NVIDIA drivers and the `nvidia-container-toolkit` so Docker can
  expose GPUs (`docker run --gpus all`).
- **Environment**: Prepare a `.env` (or secrets manager entry) with API base URL, refresh-enabled
  tokens, Redis connection string, and executor settings.
- **Image**: Build/pull the worker image (`docker build -t farlabs/gpu-worker .`) and distribute via
  registry if needed.
- **Networking**: Ensure the container can reach the Far Labs API Gateway and Redis (open firewall,
  configure VPN/peering, TLS trust stores).
- **Launch**: Run `docker run --gpus all --env-file .env farlabs/gpu-worker:latest` and confirm logs
  show registration + heartbeats.
- **Monitoring**: Hook into logs/metrics—heartbeats now include `last_latency_ms` and
  `last_tokens_per_second` for visibility.

## Current limitations

* Hugging Face backend executes single requests sequentially; batching/concurrency remains future work.
* Assumes access to Redis and the API Gateway over the public internet (you may need VPN/peering in production).
* Does not yet handle multi-task concurrency, back-pressure, or batching.
* If multiple nodes share the same Redis queue, they rely on cooperative requeueing; introducing per-node queues server-side is recommended for scale.

Feedback welcome — this is the backbone we need to let providers supply actual compute once the
model runtime is wired in.
