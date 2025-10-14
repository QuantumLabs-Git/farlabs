"""
Far Mesh Coordinator

Wraps Petals distributed inference with Far Labs payment tracking.
This is the core service that:
1. Loads models using Petals (distributed across GPU providers)
2. Tracks which nodes contribute to each inference session
3. Records usage for payment distribution
"""

import asyncio
import logging
from typing import AsyncIterator, List, Optional, Dict
from datetime import datetime, timezone
from decimal import Decimal
import uuid
import os
import torch
import asyncpg
from petals import AutoDistributedModelForCausalLM
from transformers import AutoTokenizer
from pydantic import BaseModel
try:
    from petals import DistributedBloomForCausalLM
    PETALS_FINETUNING_AVAILABLE = True
except ImportError:
    PETALS_FINETUNING_AVAILABLE = False

logger = logging.getLogger(__name__)


class InferenceRequest(BaseModel):
    """Request for distributed inference"""
    prompt: str
    max_tokens: int = 512
    temperature: float = 0.7
    top_p: float = 0.9
    user_wallet: str
    request_id: str
    model_id: str = "meta-llama/Llama-2-7b-chat-hf"


class TokenResponse(BaseModel):
    """Streaming token response"""
    token: str
    request_id: str
    tokens_generated: int
    cost_far: Decimal


class SessionMetrics(BaseModel):
    """Metrics for completed inference session"""
    request_id: str
    user_wallet: str
    model_id: str
    total_tokens: int
    total_cost_far: Decimal
    nodes_used: List[str]
    started_at: datetime
    completed_at: datetime


class FineTuningRequest(BaseModel):
    """Request for distributed fine-tuning"""
    model_id: str
    dataset_id: str
    user_wallet: str
    request_id: str
    num_epochs: int = 3
    learning_rate: float = 1e-5
    batch_size: int = 1
    max_length: int = 512
    target_modules: Optional[List[str]] = None  # For LoRA: ["query_key_value"]


class FineTuningStatus(BaseModel):
    """Status of fine-tuning job"""
    request_id: str
    status: str  # "pending", "training", "completed", "failed"
    current_epoch: int
    total_epochs: int
    loss: Optional[float] = None
    nodes_participating: int
    estimated_cost_far: Decimal


class FarMeshCoordinator:
    """
    Coordinates distributed inference using Petals with payment tracking.

    This service:
    - Connects to the Petals swarm (DHT-based mesh network)
    - Routes inference requests through distributed GPU nodes
    - Tracks which nodes contribute to each session
    - Records usage metrics for payment distribution
    """

    def __init__(
        self,
        model_id: str,
        dht_bootstrap_addr: Optional[str] = None,
        price_per_token_far: Decimal = Decimal("0.0001"),
        redis_url: str = "redis://localhost:6379",
        postgres_url: str = "postgresql://localhost/farlabs"
    ):
        """
        Initialize the Far Mesh Coordinator.

        Args:
            model_id: HuggingFace model ID (e.g., "meta-llama/Llama-2-7b-chat-hf")
            dht_bootstrap_addr: DHT bootstrap node address (e.g., "/ip4/1.2.3.4/tcp/31337")
            price_per_token_far: Price per generated token in $FAR
            redis_url: Redis connection URL
            postgres_url: PostgreSQL connection URL
        """
        self.model_id = model_id
        self.dht_bootstrap_addr = dht_bootstrap_addr
        self.price_per_token_far = price_per_token_far
        self.redis_url = redis_url
        self.postgres_url = postgres_url

        self.model: Optional[AutoDistributedModelForCausalLM] = None
        self.tokenizer: Optional[AutoTokenizer] = None
        self.active_sessions: Dict[str, dict] = {}
        self.db_pool: Optional[asyncpg.Pool] = None

        logger.info(f"Initializing Far Mesh Coordinator for model: {model_id}")

    async def initialize(self):
        """
        Initialize the Petals distributed model connection.

        This connects to the DHT network and discovers available GPU nodes
        serving the specified model.
        """
        logger.info(f"Loading distributed model: {self.model_id}")

        try:
            # Connect to PostgreSQL database
            db_url = os.getenv("DATABASE_URL", self.postgres_url)
            if not db_url:
                logger.error("DATABASE_URL environment variable is required")
                raise ValueError("DATABASE_URL must be set")

            logger.info("Connecting to PostgreSQL...")
            self.db_pool = await asyncpg.create_pool(
                db_url,
                min_size=2,
                max_size=10,
                command_timeout=60
            )
            logger.info("✓ PostgreSQL connected")

            # Load tokenizer (lightweight, runs locally)
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_id)

            # Connect to Petals swarm
            # This will automatically discover and connect to GPU nodes
            # serving this model in the DHT network
            self.model = AutoDistributedModelForCausalLM.from_pretrained(
                self.model_id,
                torch_dtype=torch.float16,
                initial_peers=[self.dht_bootstrap_addr] if self.dht_bootstrap_addr else None,
            )

            logger.info(f"✓ Connected to Far Mesh for model: {self.model_id}")
            logger.info(f"  Active GPU nodes: {self._get_active_nodes_count()}")

        except Exception as e:
            logger.error(f"Failed to initialize Far Mesh connection: {e}")
            raise

    async def generate_streaming(
        self,
        request: InferenceRequest
    ) -> AsyncIterator[TokenResponse]:
        """
        Generate tokens using distributed inference with streaming output.

        This method:
        1. Starts a payment tracking session
        2. Tokenizes the prompt
        3. Generates tokens using Petals (distributed across GPU nodes)
        4. Streams each token back to the user
        5. Tracks usage for payment

        Args:
            request: Inference request parameters

        Yields:
            TokenResponse objects with each generated token
        """
        session_id = request.request_id

        # Start tracking session
        session = {
            "request_id": session_id,
            "user_wallet": request.user_wallet,
            "model_id": request.model_id,
            "started_at": datetime.now(timezone.utc),
            "tokens_generated": 0,
            "cost_far": Decimal("0"),
            "nodes_used": {}  # Map of peer_id -> total_layers_processed
        }
        self.active_sessions[session_id] = session

        try:
            # Tokenize prompt
            inputs = self.tokenizer(request.prompt, return_tensors="pt")
            input_ids = inputs["input_ids"]

            logger.info(f"[{session_id}] Starting distributed inference")
            logger.info(f"  Prompt length: {input_ids.shape[1]} tokens")
            logger.info(f"  Max new tokens: {request.max_tokens}")

            # Generate tokens using Petals distributed inference
            # The model is split across multiple GPU nodes
            # Activations are forwarded through the mesh network
            with torch.inference_mode():
                for output in self.model.generate(
                    input_ids,
                    max_new_tokens=request.max_tokens,
                    do_sample=True,
                    temperature=request.temperature,
                    top_p=request.top_p,
                    stream=True  # Stream tokens as they're generated
                ):
                    # Decode the latest token
                    token = self.tokenizer.decode(
                        output[0][-1:],
                        skip_special_tokens=True
                    )

                    # Update session metrics
                    session["tokens_generated"] += 1
                    token_cost = self.price_per_token_far
                    session["cost_far"] += token_cost

                    # Track which nodes contributed with layer counts
                    # This accesses Petals RemoteSequential to get layer-to-peer mapping
                    contributing_nodes = self._get_contributing_nodes()

                    # Accumulate layer counts for each node across all tokens
                    for peer_id, layers in contributing_nodes.items():
                        if peer_id in session["nodes_used"]:
                            session["nodes_used"][peer_id] += layers
                        else:
                            session["nodes_used"][peer_id] = layers

                    # Yield token to user
                    yield TokenResponse(
                        token=token,
                        request_id=session_id,
                        tokens_generated=session["tokens_generated"],
                        cost_far=session["cost_far"]
                    )

            # Session completed successfully
            await self._finalize_session(session)
            logger.info(f"[{session_id}] Completed: {session['tokens_generated']} tokens")

        except Exception as e:
            logger.error(f"[{session_id}] Inference failed: {e}")
            await self._rollback_session(session)
            raise

        finally:
            # Clean up session
            if session_id in self.active_sessions:
                del self.active_sessions[session_id]

    def _get_active_nodes_count(self) -> int:
        """
        Get count of active GPU nodes serving this model.

        This queries the Petals DHT to see how many nodes are online.
        """
        try:
            if self.model and hasattr(self.model, 'dht'):
                # Access Petals DHT to get node count
                # This is a simplified implementation
                # Real implementation would query Petals internals
                return len(self.model.dht.get_visible_peers())
        except:
            pass
        return 0

    def _get_contributing_nodes(self) -> Dict[str, int]:
        """
        Get map of GPU nodes that contributed to the current inference step
        with their layer counts.

        This accesses Petals internal routing information to identify which
        peers handled layers in the distributed inference.

        Returns:
            Dictionary mapping node peer IDs to number of layers processed
        """
        contributing_nodes = {}

        try:
            if self.model and hasattr(self.model, 'dht'):
                # Access RemoteSequential to get layer-to-peer mapping
                # RemoteSequential manages the distributed transformer blocks

                if hasattr(self.model, 'transformer') and hasattr(self.model.transformer, 'h'):
                    # Get the remote sequence manager
                    remote_blocks = self.model.transformer.h

                    if hasattr(remote_blocks, 'sequence_manager'):
                        sequence_manager = remote_blocks.sequence_manager

                        # Get spans (which peers serve which layer ranges)
                        if hasattr(sequence_manager, 'state') and hasattr(sequence_manager.state, 'spans'):
                            spans = sequence_manager.state.spans

                            for span in spans:
                                # Each span contains: peer_id, start_block, end_block
                                peer_id = str(span.peer_id) if hasattr(span, 'peer_id') else None

                                if peer_id:
                                    start_block = getattr(span, 'start', 0)
                                    end_block = getattr(span, 'end', start_block + 1)
                                    layers_served = end_block - start_block

                                    # Accumulate layers per peer
                                    if peer_id in contributing_nodes:
                                        contributing_nodes[peer_id] += layers_served
                                    else:
                                        contributing_nodes[peer_id] = layers_served

                            logger.debug(f"Layer-specific tracking: {len(contributing_nodes)} nodes, "
                                       f"{sum(contributing_nodes.values())} total layers")
                        else:
                            # Fallback: get all visible peers with equal weight
                            logger.debug("Spans not available, using fallback peer detection")
                            visible_peers = self.model.dht.get_visible_peers() if hasattr(self.model, 'dht') else []

                            for peer in visible_peers:
                                peer_id = str(peer.peer_id) if hasattr(peer, 'peer_id') else str(peer)
                                contributing_nodes[peer_id] = 1  # Equal weight as fallback
                    else:
                        # Fallback: get all visible peers with equal weight
                        logger.debug("Sequence manager not available, using fallback")
                        visible_peers = self.model.dht.get_visible_peers() if hasattr(self.model, 'dht') else []

                        for peer in visible_peers:
                            peer_id = str(peer.peer_id) if hasattr(peer, 'peer_id') else str(peer)
                            contributing_nodes[peer_id] = 1  # Equal weight as fallback

        except Exception as e:
            logger.warning(f"Could not retrieve layer-specific contributions: {e}")
            logger.debug("Exception details:", exc_info=True)

            # Ultimate fallback: try to get any visible peers
            try:
                if self.model and hasattr(self.model, 'dht'):
                    visible_peers = self.model.dht.get_visible_peers()
                    for peer in visible_peers:
                        peer_id = str(peer.peer_id) if hasattr(peer, 'peer_id') else str(peer)
                        contributing_nodes[peer_id] = 1
            except:
                pass

        return contributing_nodes

    async def _finalize_session(self, session: dict):
        """
        Finalize completed inference session and record for payment.

        This:
        1. Creates session record in far_mesh_sessions table
        2. Records node contributions in far_session_contributions table
        3. Calculates and distributes payment to GPU providers
        4. Updates node statistics
        """
        session["completed_at"] = datetime.now(timezone.utc)

        if not self.db_pool:
            logger.error("Database pool not initialized, cannot finalize session")
            return

        try:
            async with self.db_pool.acquire() as conn:
                # Generate session UUID
                session_id = uuid.UUID(session["request_id"])

                # 1. Insert session record
                await conn.execute("""
                    INSERT INTO far_mesh_sessions (
                        id, user_wallet, model_id, status,
                        tokens_generated, total_cost_far,
                        created_at, completed_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    ON CONFLICT (id) DO UPDATE SET
                        status = EXCLUDED.status,
                        tokens_generated = EXCLUDED.tokens_generated,
                        total_cost_far = EXCLUDED.total_cost_far,
                        completed_at = EXCLUDED.completed_at
                """,
                    session_id,
                    session["user_wallet"].lower(),
                    session["model_id"],
                    "completed",
                    session["tokens_generated"],
                    float(session["cost_far"]),
                    session["started_at"],
                    session["completed_at"]
                )

                # 2. Record node contributions with proportional payment
                nodes_used = session["nodes_used"]  # Dict of peer_id -> layers_processed
                if nodes_used:
                    # Calculate total layers processed across all nodes
                    total_layers = sum(nodes_used.values())

                    if total_layers > 0:
                        paid_nodes = 0

                        for peer_id, layers_processed in nodes_used.items():
                            # Calculate payment proportional to work done
                            # payment = (layers_processed / total_layers) * total_cost
                            payment_proportion = Decimal(layers_processed) / Decimal(total_layers)
                            payment_far = session["cost_far"] * payment_proportion

                            # Try to find node by peer_id in far_nodes table
                            # If node doesn't exist, we'll skip it (node needs to register first)
                            node_row = await conn.fetchrow("""
                                SELECT id FROM far_nodes
                                WHERE peer_id = $1 AND status = 'active'
                                LIMIT 1
                            """, peer_id)

                            if node_row:
                                node_id = node_row['id']

                                # Insert contribution record with proportional payment
                                await conn.execute("""
                                    INSERT INTO far_session_contributions (
                                        session_id, node_id, tokens_contributed, payment_far
                                    ) VALUES ($1, $2, $3, $4)
                                    ON CONFLICT (session_id, node_id) DO UPDATE SET
                                        tokens_contributed = EXCLUDED.tokens_contributed,
                                        payment_far = EXCLUDED.payment_far
                                """,
                                    session_id,
                                    node_id,
                                    layers_processed,  # Number of layers this node processed
                                    float(payment_far)
                                )
                                paid_nodes += 1

                                logger.debug(f"Node {peer_id}: {layers_processed} layers "
                                           f"({payment_proportion:.1%} of work) = {payment_far:.6f} FAR")
                            else:
                                logger.warning(f"Node {peer_id} not found in database, skipping payment")

                        logger.info(f"[{session['request_id']}] Payment distribution:")
                        logger.info(f"  Total layers: {total_layers}")
                        logger.info(f"  Nodes paid: {paid_nodes}/{len(nodes_used)}")
                    else:
                        logger.warning(f"[{session['request_id']}] No layers tracked, using equal distribution")
                        # Fallback to equal distribution if no layer tracking
                        payment_per_node = session["cost_far"] / len(nodes_used)

                        for peer_id in nodes_used.keys():
                            node_row = await conn.fetchrow("""
                                SELECT id FROM far_nodes
                                WHERE peer_id = $1 AND status = 'active'
                                LIMIT 1
                            """, peer_id)

                            if node_row:
                                node_id = node_row['id']
                                await conn.execute("""
                                    INSERT INTO far_session_contributions (
                                        session_id, node_id, tokens_contributed, payment_far
                                    ) VALUES ($1, $2, $3, $4)
                                    ON CONFLICT (session_id, node_id) DO UPDATE SET
                                        tokens_contributed = EXCLUDED.tokens_contributed,
                                        payment_far = EXCLUDED.payment_far
                                """,
                                    session_id,
                                    node_id,
                                    1,  # Equal contribution
                                    float(payment_per_node)
                                )

                    # 3. Call finalize_session PostgreSQL function to update node stats
                    await conn.execute("""
                        SELECT finalize_session($1, $2, $3)
                    """,
                        session_id,
                        session["tokens_generated"],
                        float(session["cost_far"])
                    )

                    logger.info(f"[{session['request_id']}] Session finalized:")
                    logger.info(f"  Tokens: {session['tokens_generated']}")
                    logger.info(f"  Cost: {session['cost_far']} FAR")
                    logger.info(f"  Nodes: {len(nodes_used)} unique peers")
                else:
                    logger.warning(f"[{session['request_id']}] No contributing nodes found")

        except Exception as e:
            logger.error(f"Failed to finalize session {session['request_id']}: {e}")
            # Don't raise - we don't want to fail the user's request if DB write fails

    async def _rollback_session(self, session: dict):
        """
        Rollback failed inference session.

        Marks session as failed, no payments are distributed.
        """
        session["failed_at"] = datetime.now(timezone.utc)

        logger.warning(f"[{session['request_id']}] Session rolled back")

    async def start_fine_tuning(
        self,
        request: FineTuningRequest
    ) -> FineTuningStatus:
        """
        Start distributed fine-tuning job across the mesh network.

        This method:
        1. Validates the fine-tuning configuration
        2. Initializes distributed training across GPU nodes
        3. Sets up gradient synchronization
        4. Tracks training progress and costs

        Args:
            request: Fine-tuning job configuration

        Returns:
            Initial status of the fine-tuning job

        Note:
            Fine-tuning requires Petals v2.0+ with training support
        """
        if not PETALS_FINETUNING_AVAILABLE:
            raise RuntimeError(
                "Fine-tuning is not available. Please ensure you have Petals v2.0+ installed "
                "with training dependencies: pip install petals[training]"
            )

        job_id = request.request_id

        logger.info(f"[{job_id}] Starting distributed fine-tuning job")
        logger.info(f"  Model: {request.model_id}")
        logger.info(f"  Dataset: {request.dataset_id}")
        logger.info(f"  Epochs: {request.num_epochs}")
        logger.info(f"  Learning rate: {request.learning_rate}")

        try:
            # TODO: Implement actual Petals fine-tuning logic
            # This would include:
            # 1. Load model with training mode enabled
            # 2. Load and prepare dataset
            # 3. Initialize distributed optimizer (e.g., CollaborativeOptimizer)
            # 4. Set up gradient accumulation across nodes
            # 5. Configure LoRA adapters if specified
            # 6. Start training loop with cost tracking

            # For now, return a placeholder status
            logger.warning(f"[{job_id}] Fine-tuning not fully implemented yet")

            # Estimate cost based on expected compute
            # Cost = (num_epochs * dataset_size * layers) * price_per_step
            estimated_cost = Decimal("10.0")  # Placeholder

            return FineTuningStatus(
                request_id=job_id,
                status="pending",
                current_epoch=0,
                total_epochs=request.num_epochs,
                loss=None,
                nodes_participating=self._get_active_nodes_count(),
                estimated_cost_far=estimated_cost
            )

        except Exception as e:
            logger.error(f"[{job_id}] Failed to start fine-tuning: {e}")
            raise

    async def get_fine_tuning_status(self, request_id: str) -> FineTuningStatus:
        """
        Get status of a fine-tuning job.

        Args:
            request_id: ID of the fine-tuning job

        Returns:
            Current status of the job
        """
        # TODO: Query actual fine-tuning job status from training state
        logger.debug(f"Checking fine-tuning status for {request_id}")

        return FineTuningStatus(
            request_id=request_id,
            status="not_implemented",
            current_epoch=0,
            total_epochs=0,
            loss=None,
            nodes_participating=0,
            estimated_cost_far=Decimal("0")
        )

    async def cancel_fine_tuning(self, request_id: str) -> bool:
        """
        Cancel a running fine-tuning job.

        Args:
            request_id: ID of the fine-tuning job to cancel

        Returns:
            True if successfully canceled, False otherwise
        """
        logger.info(f"Canceling fine-tuning job: {request_id}")

        # TODO: Implement actual cancellation logic
        # This would include:
        # 1. Stop the training loop
        # 2. Save current checkpoint
        # 3. Calculate actual cost based on steps completed
        # 4. Distribute payments to participating nodes
        # 5. Clean up distributed training state

        logger.warning("Fine-tuning cancellation not fully implemented yet")
        return False

    async def get_mesh_status(self) -> dict:
        """
        Get current status of the Far Mesh network.

        Returns information about:
        - Connected GPU nodes
        - Models available
        - Network health
        """
        return {
            "model_id": self.model_id,
            "active_nodes": self._get_active_nodes_count(),
            "active_sessions": len(self.active_sessions),
            "price_per_token_far": str(self.price_per_token_far),
            "status": "connected" if self.model else "disconnected",
            "fine_tuning_available": PETALS_FINETUNING_AVAILABLE
        }

    async def shutdown(self):
        """Gracefully shutdown coordinator"""
        logger.info("Shutting down Far Mesh Coordinator")

        # Wait for active sessions to complete (with timeout)
        if self.active_sessions:
            logger.info(f"Waiting for {len(self.active_sessions)} active sessions...")
            await asyncio.sleep(5)  # Grace period

        # Close database pool
        if self.db_pool:
            await self.db_pool.close()
            logger.info("✓ Database pool closed")

        # Close Petals connection
        if self.model:
            # Petals doesn't have explicit close, but we can clear references
            self.model = None
            self.tokenizer = None

        logger.info("Far Mesh Coordinator shutdown complete")
