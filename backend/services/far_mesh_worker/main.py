#!/usr/bin/env python3
"""
Far Labs GPU Mesh Worker

This worker participates in the distributed
Far Mesh network for decentralized AI inference.
"""

import os
import sys
import time
import logging
import asyncio
from typing import Optional
from pathlib import Path

import httpx
import pynvml
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class FarMeshWorker:
    """Far Labs distributed inference worker"""

    def __init__(self):
        # Required configuration
        self.wallet_address = os.getenv("FARLABS_WALLET_ADDRESS")
        self.dht_bootstrap = os.getenv("FARLABS_DHT_BOOTSTRAP")
        self.api_base_url = os.getenv("FARLABS_API_BASE_URL")

        if not all([self.wallet_address, self.dht_bootstrap, self.api_base_url]):
            raise ValueError(
                "Missing required environment variables: "
                "FARLABS_WALLET_ADDRESS, FARLABS_DHT_BOOTSTRAP, FARLABS_API_BASE_URL"
            )

        # Optional configuration
        self.model_name = os.getenv("FARLABS_MODEL_NAME", "meta-llama/Llama-2-7b-chat-hf")
        self.num_blocks = os.getenv("FARLABS_NUM_BLOCKS")  # Auto-detect if not set
        self.torch_dtype = os.getenv("FARLABS_TORCH_DTYPE", "float16")
        self.location = os.getenv("FARLABS_LOCATION", "Unknown")
        self.heartbeat_interval = int(os.getenv("FARLABS_HEARTBEAT_INTERVAL", "30"))

        # Internal state
        self.node_id: Optional[str] = None
        self.server = None
        self.running = False

        logger.info(f"Far Mesh Worker initialized for wallet: {self.wallet_address}")
        logger.info(f"Model: {self.model_name}")
        logger.info(f"DHT Bootstrap: {self.dht_bootstrap}")

    def get_gpu_info(self):
        """Get GPU information using pynvml"""
        try:
            pynvml.nvmlInit()
            handle = pynvml.nvmlDeviceGetHandleByIndex(0)

            name = pynvml.nvmlDeviceGetName(handle)
            if isinstance(name, bytes):
                name = name.decode('utf-8')

            mem_info = pynvml.nvmlDeviceGetMemoryInfo(handle)
            vram_gb = mem_info.total / (1024 ** 3)

            return {
                "gpu_model": name,
                "vram_gb": round(vram_gb, 2)
            }
        except Exception as e:
            logger.warning(f"Failed to get GPU info: {e}")
            return {
                "gpu_model": "Unknown",
                "vram_gb": 8
            }

    async def register_node(self):
        """Register this worker with the Far Labs API"""
        gpu_info = self.get_gpu_info()

        payload = {
            "wallet_address": self.wallet_address,
            "gpu_model": gpu_info["gpu_model"],
            "vram_gb": gpu_info["vram_gb"],
            "bandwidth_gbps": 10,  # TODO: Measure actual bandwidth
            "location": self.location,
            "node_type": "far_mesh",  # Distinguish from Far Mono workers
            "model_name": self.model_name
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_base_url}/api/gpu/nodes",
                    json=payload,
                    timeout=15.0
                )
                response.raise_for_status()
                data = response.json()
                self.node_id = data.get("node_id")
                logger.info(f"✓ Registered as node: {self.node_id}")
                return self.node_id
        except Exception as e:
            logger.error(f"Failed to register node: {e}")
            raise

    async def send_heartbeat(self):
        """Send heartbeat to Far Labs API"""
        if not self.node_id:
            logger.warning("Cannot send heartbeat: node not registered")
            return

        try:
            # Get current GPU utilization
            pynvml.nvmlInit()
            handle = pynvml.nvmlDeviceGetHandleByIndex(0)
            utilization = pynvml.nvmlDeviceGetUtilizationRates(handle)

            payload = {
                "status": "online",
                "gpu_utilization": utilization.gpu,
                "model_name": self.model_name
            }

            async with httpx.AsyncClient() as client:
                response = await client.put(
                    f"{self.api_base_url}/api/gpu/nodes/{self.node_id}/heartbeat",
                    json=payload,
                    timeout=10.0
                )
                response.raise_for_status()
                logger.debug(f"Heartbeat sent (GPU: {utilization.gpu}%)")
        except Exception as e:
            logger.warning(f"Heartbeat failed: {e}")

    async def heartbeat_loop(self):
        """Background task to send periodic heartbeats"""
        while self.running:
            await self.send_heartbeat()
            await asyncio.sleep(self.heartbeat_interval)

    def start_mesh_server(self):
        """Start the distributed mesh server"""
        logger.info("Starting distributed mesh server...")
        logger.info(f"Model: {self.model_name}")
        logger.info(f"DHT: {self.dht_bootstrap}")

        try:
            # TODO: Implement distributed server configuration
            # Placeholder for distributed inference server

            # Configure mesh server
            config = ServerConfig(
                model_name=self.model_name,
                dht_prefix=f"farlabs_{self.model_name}",  # Namespace for Far Labs
                initial_peers=[self.dht_bootstrap],
                torch_dtype=self.torch_dtype,
                attn_cache_size=0.3,  # 30% of GPU memory for attention cache
                cache_dir=os.path.expanduser("~/.cache/huggingface"),
                use_auth_token=None  # Public models only for now
            )

            # Auto-detect number of blocks if not specified
            if self.num_blocks:
                config.num_blocks = int(self.num_blocks)

            logger.info("✓ Mesh server configuration ready")
            logger.info("Connecting to DHT and downloading model weights...")
            logger.info("This may take 10-30 minutes on first run")

            # Start server (blocking)
            run_server(config)

        except ImportError:
            logger.error("Distributed inference dependencies not installed.")
            raise
        except Exception as e:
            logger.error(f"Failed to start mesh server: {e}")
            raise

    async def run(self):
        """Main worker loop"""
        try:
            # Register with Far Labs API
            await self.register_node()

            # Start heartbeat task
            self.running = True
            heartbeat_task = asyncio.create_task(self.heartbeat_loop())

            logger.info("✓ Far Mesh Worker is running")
            logger.info(f"✓ Wallet: {self.wallet_address}")
            logger.info(f"✓ Node ID: {self.node_id}")
            logger.info("━" * 60)

            # Start mesh server (blocking - runs in main thread)
            # This will keep the worker running until interrupted
            await asyncio.to_thread(self.start_mesh_server)

        except KeyboardInterrupt:
            logger.info("\n Shutting down gracefully...")
        except Exception as e:
            logger.error(f"Worker error: {e}", exc_info=True)
        finally:
            self.running = False
            logger.info("✓ Far Mesh Worker stopped")


def main():
    """Entry point"""
    logger.info("=" * 60)
    logger.info("Far Labs GPU Mesh Worker")
    logger.info("=" * 60)

    try:
        worker = FarMeshWorker()
        asyncio.run(worker.run())
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
