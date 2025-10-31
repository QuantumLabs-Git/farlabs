#!/usr/bin/env python3
"""
Far Labs GPU Mesh Worker - FarMesh Server

This worker runs FarMesh server blocks that participate in the distributed
Far Mesh network for decentralized AI inference.

Supports: NVIDIA GPUs (CUDA) and Apple Silicon (M1/M2/M3 via MPS)
"""

import os
import sys
import time
import logging
import asyncio
import platform
from typing import Optional, Dict
from pathlib import Path

import httpx
import torch
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def detect_device() -> tuple[str, str]:
    """
    Detect available compute device.
    Returns: (device_type, device_name)
    """
    # Check for CUDA (NVIDIA GPUs)
    if torch.cuda.is_available():
        return "cuda", torch.cuda.get_device_name(0)

    # Check for MPS (Apple Silicon)
    if torch.backends.mps.is_available():
        # Get Mac model info
        mac_model = platform.mac_ver()[0]
        processor = platform.processor()
        return "mps", f"Apple Silicon ({processor})"

    # Fallback to CPU
    return "cpu", f"CPU ({platform.processor()})"


class FarMeshWorker:
    """Far Labs FarMesh server worker"""

    def __init__(self):
        # Detect device
        self.device_type, self.device_name = detect_device()
        logger.info(f"Detected device: {self.device_type} - {self.device_name}")

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
        self.model_name = os.getenv("FARLABS_MODEL_NAME", "bigscience/bloom-560m")
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

    def get_gpu_info(self) -> Dict[str, any]:
        """Get GPU/device information"""

        # NVIDIA GPU (CUDA)
        if self.device_type == "cuda":
            try:
                import pynvml
                pynvml.nvmlInit()
                handle = pynvml.nvmlDeviceGetHandleByIndex(0)

                name = pynvml.nvmlDeviceGetName(handle)
                if isinstance(name, bytes):
                    name = name.decode('utf-8')

                mem_info = pynvml.nvmlDeviceGetMemoryInfo(handle)
                vram_gb = mem_info.total / (1024 ** 3)

                return {
                    "gpu_model": name,
                    "vram_gb": round(vram_gb, 2),
                    "device_type": "cuda"
                }
            except Exception as e:
                logger.warning(f"Failed to get NVIDIA GPU info: {e}")

        # Apple Silicon (MPS)
        elif self.device_type == "mps":
            try:
                # Get system memory as proxy for unified memory
                import psutil
                total_memory = psutil.virtual_memory().total / (1024 ** 3)

                # Apple Silicon uses unified memory
                # Estimate ~60% available for GPU tasks
                available_vram = round(total_memory * 0.6, 2)

                return {
                    "gpu_model": self.device_name,
                    "vram_gb": available_vram,
                    "device_type": "mps"
                }
            except Exception as e:
                logger.warning(f"Failed to get Apple Silicon info: {e}")

        # Fallback for CPU or unknown
        return {
            "gpu_model": f"CPU - {platform.processor()}",
            "vram_gb": 8,
            "device_type": "cpu"
        }

    def get_gpu_utilization(self) -> int:
        """Get current GPU utilization percentage"""

        # NVIDIA GPU
        if self.device_type == "cuda":
            try:
                import pynvml
                pynvml.nvmlInit()
                handle = pynvml.nvmlDeviceGetHandleByIndex(0)
                utilization = pynvml.nvmlDeviceGetUtilizationRates(handle)
                return utilization.gpu
            except Exception:
                return 0

        # Apple Silicon - estimate based on memory pressure
        elif self.device_type == "mps":
            try:
                import psutil
                # Use memory usage as proxy for GPU utilization
                mem = psutil.virtual_memory()
                return int(mem.percent)
            except Exception:
                return 0

        # CPU fallback
        return 0

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
            "model_name": self.model_name,
            "device_type": gpu_info.get("device_type", "unknown")
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
            utilization = self.get_gpu_utilization()

            payload = {
                "status": "online",
                "gpu_utilization": utilization,
                "model_name": self.model_name
            }

            async with httpx.AsyncClient() as client:
                response = await client.put(
                    f"{self.api_base_url}/api/gpu/nodes/{self.node_id}/heartbeat",
                    json=payload,
                    timeout=10.0
                )
                response.raise_for_status()
                logger.debug(f"Heartbeat sent ({self.device_type.upper()}: {utilization}%)")
        except Exception as e:
            logger.warning(f"Heartbeat failed: {e}")

    async def heartbeat_loop(self):
        """Background task to send periodic heartbeats"""
        while self.running:
            await self.send_heartbeat()
            await asyncio.sleep(self.heartbeat_interval)

    def start_farmesh_server(self):
        """Start the FarMesh server"""
        logger.info("Starting FarMesh server...")
        logger.info(f"Model: {self.model_name}")
        logger.info(f"Device: {self.device_type}")
        logger.info(f"DHT: {self.dht_bootstrap}")

        try:
            # Import FarMesh here to fail fast if not installed
            from farmesh import ServerConfig, run_server

            # Configure FarMesh server with device-specific settings
            config = ServerConfig(
                model_name=self.model_name,
                dht_prefix=f"farlabs_{self.model_name}",  # Namespace for Far Labs
                initial_peers=[self.dht_bootstrap],
                torch_dtype=self.torch_dtype,
                attn_cache_size=0.3,  # 30% of memory for attention cache
                cache_dir=os.path.expanduser("~/.cache/huggingface"),
                use_auth_token=None  # Public models only for now
            )

            # Set device for FarMesh
            if self.device_type == "mps":
                # Apple Silicon: Use MPS backend
                config.device = "mps"
                logger.info("✓ Using Apple Silicon MPS backend")
            elif self.device_type == "cuda":
                # NVIDIA: Use CUDA
                config.device = "cuda"
                logger.info("✓ Using NVIDIA CUDA backend")
            else:
                # Fallback to CPU
                config.device = "cpu"
                logger.warning("⚠ Using CPU (slow performance expected)")

            # Auto-detect number of blocks if not specified
            if self.num_blocks:
                config.num_blocks = int(self.num_blocks)

            logger.info("✓ FarMesh configuration ready")
            logger.info("Connecting to DHT and downloading model weights...")

            if self.device_type == "mps":
                logger.info("First run may take 5-15 minutes on Apple Silicon")
            else:
                logger.info("First run may take 10-30 minutes")

            # Start server (blocking)
            run_server(config)

        except ImportError:
            logger.error("FarMesh not installed. Please install with: pip install farmesh")
            raise
        except Exception as e:
            logger.error(f"Failed to start FarMesh server: {e}")
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
            logger.info(f"✓ Device: {self.device_type.upper()} - {self.device_name}")
            logger.info(f"✓ Wallet: {self.wallet_address}")
            logger.info(f"✓ Node ID: {self.node_id}")
            logger.info("━" * 60)

            # Start FarMesh server (blocking - runs in main thread)
            # This will keep the worker running until interrupted
            await asyncio.to_thread(self.start_farmesh_server)

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
    logger.info("Far Labs GPU Mesh Worker (FarMesh Server)")
    logger.info("=" * 60)

    # Display device compatibility info
    device_type, device_name = detect_device()
    logger.info(f"Device: {device_type.upper()} - {device_name}")

    if device_type == "mps":
        logger.info("✓ Apple Silicon detected - MPS backend enabled")
    elif device_type == "cuda":
        logger.info("✓ NVIDIA GPU detected - CUDA backend enabled")
    else:
        logger.warning("⚠ No GPU detected - CPU mode (limited performance)")

    logger.info("=" * 60)

    try:
        worker = FarMeshWorker()
        asyncio.run(worker.run())
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
