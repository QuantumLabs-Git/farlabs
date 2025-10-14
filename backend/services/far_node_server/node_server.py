"""
Far Node Server

Runs on GPU provider's machine to:
1. Start Petals server serving model layers
2. Register with Far Labs discovery service
3. Send heartbeats and metrics
4. Track earnings
"""

import asyncio
import logging
import os
import signal
import sys
from typing import Optional
from datetime import datetime, timezone
from decimal import Decimal
import socket
import httpx
import torch
import pynvml
import psutil
from pydantic import BaseModel
from petals import server as petals_server

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class NodeConfig(BaseModel):
    """Far Node configuration"""
    wallet_address: str
    model_id: str = "meta-llama/Llama-2-7b-chat-hf"
    public_addr: str  # e.g., "1.2.3.4:31330" or domain
    discovery_service_url: str = "http://discovery.farlabs.ai"
    dht_bootstrap_addr: Optional[str] = None

    # Server settings
    port: int = 31330
    num_blocks: Optional[int] = None  # Auto-detect based on VRAM
    torch_dtype: str = "float16"  # or "int8", "int4"

    # Heartbeat
    heartbeat_interval_seconds: int = 30


class HardwareInfo(BaseModel):
    """GPU hardware information"""
    gpu_model: str
    gpu_count: int
    vram_total_gb: float
    vram_available_gb: float
    cpu_cores: int
    ram_total_gb: float
    ram_available_gb: float


class FarNodeServer:
    """
    Far Node Server - runs Petals server and registers with Far Labs.
    """

    def __init__(self, config: NodeConfig):
        self.config = config
        self.node_id: Optional[str] = None
        self.hardware_info: Optional[HardwareInfo] = None
        self.petals_server: Optional[petals_server.Server] = None
        self.running = False
        self.total_tokens_served = 0
        self.total_earned_far = Decimal("0")

        # HTTP client for discovery service
        self.http_client = httpx.AsyncClient(timeout=30.0)

    async def initialize(self):
        """Initialize the node server"""
        logger.info("=" * 60)
        logger.info("Far Node Server Initialization")
        logger.info("=" * 60)

        # 1. Detect hardware
        logger.info("Detecting hardware...")
        self.hardware_info = self._detect_hardware()
        self._log_hardware_info()

        # 2. Start Petals server
        logger.info(f"\nStarting Petals server for model: {self.config.model_id}")
        await self._start_petals_server()

        # 3. Register with Far Labs discovery service
        logger.info("\nRegistering with Far Labs discovery service...")
        await self._register_with_discovery()

        logger.info("\n" + "=" * 60)
        logger.info("✓ Far Node Server is ready and earning $FAR!")
        logger.info("=" * 60)
        logger.info(f"Wallet: {self.config.wallet_address}")
        logger.info(f"Model: {self.config.model_id}")
        logger.info(f"Public Address: {self.config.public_addr}")
        logger.info("=" * 60 + "\n")

    def _detect_hardware(self) -> HardwareInfo:
        """Detect GPU and system hardware"""
        try:
            pynvml.nvmlInit()
            gpu_count = pynvml.nvmlDeviceGetCount()

            if gpu_count == 0:
                raise RuntimeError("No NVIDIA GPU detected!")

            # Get info from first GPU
            handle = pynvml.nvmlDeviceGetHandleByIndex(0)
            gpu_name = pynvml.nvmlDeviceGetName(handle)
            if isinstance(gpu_name, bytes):
                gpu_name = gpu_name.decode('utf-8')

            memory_info = pynvml.nvmlDeviceGetMemoryInfo(handle)
            vram_total_gb = memory_info.total / (1024 ** 3)
            vram_available_gb = memory_info.free / (1024 ** 3)

        except Exception as e:
            logger.error(f"Failed to detect GPU: {e}")
            logger.warning("Continuing without GPU info (may not work without CUDA)")
            gpu_name = "Unknown"
            gpu_count = 0
            vram_total_gb = 0
            vram_available_gb = 0

        # System RAM
        ram_info = psutil.virtual_memory()
        ram_total_gb = ram_info.total / (1024 ** 3)
        ram_available_gb = ram_info.available / (1024 ** 3)

        return HardwareInfo(
            gpu_model=gpu_name,
            gpu_count=gpu_count,
            vram_total_gb=round(vram_total_gb, 2),
            vram_available_gb=round(vram_available_gb, 2),
            cpu_cores=psutil.cpu_count(),
            ram_total_gb=round(ram_total_gb, 2),
            ram_available_gb=round(ram_available_gb, 2)
        )

    def _log_hardware_info(self):
        """Log hardware information"""
        hw = self.hardware_info
        logger.info(f"  GPU: {hw.gpu_model} ({hw.gpu_count}x)")
        logger.info(f"  VRAM: {hw.vram_available_gb:.1f} GB / {hw.vram_total_gb:.1f} GB available")
        logger.info(f"  CPU: {hw.cpu_cores} cores")
        logger.info(f"  RAM: {hw.ram_available_gb:.1f} GB / {hw.ram_total_gb:.1f} GB available")

    async def _start_petals_server(self):
        """Start Petals server in the background"""

        # Determine how many transformer blocks to serve based on VRAM
        if self.config.num_blocks is None:
            # Rule of thumb: 1-2 GB VRAM per transformer block for Llama-2-7B in fp16
            # With 24GB VRAM, can serve ~12 blocks safely
            blocks_per_gb = 0.5
            num_blocks = int(self.hardware_info.vram_available_gb * blocks_per_gb)
            num_blocks = max(1, min(num_blocks, 32))  # Between 1-32 blocks
        else:
            num_blocks = self.config.num_blocks

        logger.info(f"  Serving {num_blocks} transformer blocks")
        logger.info(f"  Precision: {self.config.torch_dtype}")
        logger.info(f"  Port: {self.config.port}")

        # Convert torch dtype
        dtype_map = {
            "float16": torch.float16,
            "bfloat16": torch.bfloat16,
            "int8": torch.int8,
        }
        torch_dtype = dtype_map.get(self.config.torch_dtype, torch.float16)

        # Build initial peers list
        initial_peers = []
        if self.config.dht_bootstrap_addr:
            initial_peers = [self.config.dht_bootstrap_addr]

        # Start Petals server (runs in background threads)
        # Note: Petals server.run() is blocking, so we'd need to run it in a separate process
        # For now, we'll use server.Server() which allows more control

        try:
            self.petals_server = petals_server.Server(
                model_name_or_path=self.config.model_id,
                num_blocks=num_blocks,
                torch_dtype=torch_dtype,
                host="0.0.0.0",
                port=self.config.port,
                initial_peers=initial_peers if initial_peers else None,
                public_name=self.config.public_addr,
            )

            # Server starts automatically when created
            # Get the node ID (DHT peer ID)
            await asyncio.sleep(2)  # Give it time to start

            # Extract node ID from Petals DHT
            if hasattr(self.petals_server, 'dht') and self.petals_server.dht:
                self.node_id = str(self.petals_server.dht.peer_id)
            else:
                # Fallback: use wallet address as node ID
                self.node_id = f"far_node_{self.config.wallet_address[:16]}"

            logger.info(f"  ✓ Petals server started")
            logger.info(f"  Node ID: {self.node_id}")

        except Exception as e:
            logger.error(f"Failed to start Petals server: {e}")
            raise

    async def _register_with_discovery(self):
        """Register this node with Far Labs discovery service"""

        # Get public IP if not provided
        public_addr = self.config.public_addr
        if not public_addr or public_addr == "auto":
            public_addr = await self._get_public_ip()
            public_addr = f"{public_addr}:{self.config.port}"

        registration_data = {
            "node_id": self.node_id,
            "wallet_address": self.config.wallet_address,
            "model_id": self.config.model_id,
            "public_addr": public_addr,
            "gpu_model": self.hardware_info.gpu_model,
            "vram_gb": int(self.hardware_info.vram_total_gb),
            "cpu_cores": self.hardware_info.cpu_cores,
            "ram_gb": int(self.hardware_info.ram_total_gb),
        }

        try:
            response = await self.http_client.post(
                f"{self.config.discovery_service_url}/nodes/register",
                json=registration_data
            )
            response.raise_for_status()
            result = response.json()

            logger.info(f"  ✓ Registered with discovery service")
            logger.info(f"  Status: {result.get('status')}")

        except Exception as e:
            logger.error(f"Failed to register with discovery service: {e}")
            logger.warning("Continuing anyway - will retry on next heartbeat")

    async def _get_public_ip(self) -> str:
        """Get public IP address"""
        try:
            response = await self.http_client.get("https://api.ipify.org?format=json")
            return response.json()["ip"]
        except:
            # Fallback: use local IP
            return socket.gethostbyname(socket.gethostname())

    async def run(self):
        """Main run loop with heartbeat"""
        self.running = True

        try:
            while self.running:
                # Send heartbeat
                await self._send_heartbeat()

                # Wait for next heartbeat
                await asyncio.sleep(self.config.heartbeat_interval_seconds)

        except asyncio.CancelledError:
            logger.info("Run loop cancelled")
        except Exception as e:
            logger.error(f"Error in run loop: {e}")
            raise

    async def _send_heartbeat(self):
        """Send heartbeat to discovery service"""

        # Update hardware stats
        current_hw = self._detect_hardware()

        heartbeat_data = {
            "node_id": self.node_id,
            "wallet_address": self.config.wallet_address,
            "vram_available_gb": current_hw.vram_available_gb,
            "ram_available_gb": current_hw.ram_available_gb,
            "cpu_usage_percent": psutil.cpu_percent(interval=1),
            "uptime_seconds": int((datetime.now(timezone.utc) - self._start_time).total_seconds()),
        }

        try:
            response = await self.http_client.post(
                f"{self.config.discovery_service_url}/nodes/heartbeat",
                json=heartbeat_data
            )
            response.raise_for_status()
            result = response.json()

            # Update earnings from discovery service
            if "earnings" in result:
                self.total_earned_far = Decimal(str(result["earnings"]["total_earned_far"]))
                self.total_tokens_served = result["earnings"]["total_tokens_served"]

                logger.info(f"[Heartbeat] Tokens: {self.total_tokens_served} | "
                          f"Earned: {self.total_earned_far} FAR | "
                          f"VRAM: {current_hw.vram_available_gb:.1f}GB")

        except Exception as e:
            logger.warning(f"Heartbeat failed: {e}")

    async def shutdown(self):
        """Gracefully shutdown the node"""
        logger.info("\nShutting down Far Node Server...")

        self.running = False

        # Unregister from discovery
        try:
            await self.http_client.post(
                f"{self.config.discovery_service_url}/nodes/unregister",
                json={"node_id": self.node_id}
            )
            logger.info("✓ Unregistered from discovery service")
        except Exception as e:
            logger.warning(f"Failed to unregister: {e}")

        # Shutdown Petals server
        if self.petals_server:
            try:
                self.petals_server.shutdown()
                logger.info("✓ Petals server stopped")
            except Exception as e:
                logger.warning(f"Failed to stop Petals server: {e}")

        # Close HTTP client
        await self.http_client.aclose()

        logger.info("✓ Far Node Server shutdown complete")
        logger.info(f"\nFinal Stats:")
        logger.info(f"  Tokens Served: {self.total_tokens_served}")
        logger.info(f"  Total Earned: {self.total_earned_far} FAR")


async def main():
    """Main entry point"""

    # Load configuration from environment
    config = NodeConfig(
        wallet_address=os.getenv("FAR_NODE_WALLET", ""),
        model_id=os.getenv("FAR_NODE_MODEL", "meta-llama/Llama-2-7b-chat-hf"),
        public_addr=os.getenv("FAR_NODE_PUBLIC_ADDR", "auto"),
        discovery_service_url=os.getenv("FAR_DISCOVERY_URL", "http://discovery.farlabs.ai"),
        dht_bootstrap_addr=os.getenv("FAR_MESH_DHT_BOOTSTRAP"),
        port=int(os.getenv("FAR_NODE_PORT", "31330")),
        torch_dtype=os.getenv("FAR_NODE_DTYPE", "float16"),
    )

    # Validate wallet address
    if not config.wallet_address or not config.wallet_address.startswith("0x"):
        logger.error("ERROR: FAR_NODE_WALLET environment variable must be set to your Ethereum wallet address")
        logger.error("Example: export FAR_NODE_WALLET=0x742d35Cc6634C0532925a3b844Bc454e4438f44e")
        sys.exit(1)

    # Create and run node server
    node = FarNodeServer(config)
    node._start_time = datetime.now(timezone.utc)

    # Setup signal handlers for graceful shutdown
    loop = asyncio.get_event_loop()

    def signal_handler():
        logger.info("\nReceived shutdown signal...")
        asyncio.create_task(node.shutdown())
        loop.stop()

    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, signal_handler)

    try:
        # Initialize
        await node.initialize()

        # Run
        await node.run()

    except KeyboardInterrupt:
        logger.info("\nKeyboard interrupt received")
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        raise
    finally:
        await node.shutdown()


if __name__ == "__main__":
    asyncio.run(main())
