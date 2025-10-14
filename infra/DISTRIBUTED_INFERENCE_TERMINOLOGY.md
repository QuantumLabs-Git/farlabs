# Far Labs Distributed Inference - Terminology Guide

This document defines Far Labs' proprietary terminology for our distributed inference system, avoiding direct references to third-party projects.

## Terminology Mapping

### Core Concepts

| Instead of | Use | Description |
|-----------|-----|-------------|
| Petals | **Far Mesh** | Far Labs' distributed inference mesh network |
| Petals server | **Far Node** | Individual GPU provider nodes in the mesh |
| Petals client | **Far Client** | Applications/users consuming distributed inference |
| Petals swarm | **Far Cluster** | Collection of Far Nodes working together |
| Pet als DHT | **Far Discovery** | Peer discovery and routing system |
| Hivemind | **Far Swarm** | Alternative distributed coordination layer |

### Technical Components

| Instead of | Use | Description |
|-----------|-----|-------------|
| Petals spike/test | **Distributed Inference R&D** | Phase 1 research and development |
| Model sharding | **Layer Distribution** | Splitting model layers across nodes |
| Activation forwarding | **Tensor Streaming** | Passing activations between nodes |
| P2P network | **Mesh Network** | Node-to-node communication fabric |
| DHT (Distributed Hash Table) | **Discovery Protocol** | Peer finding and health tracking |

### Infrastructure

| Instead of | Use | Description |
|-----------|-----|-------------|
| farlabs-petals-spike | **farlabs-dist-inference-rnd** | R&D infrastructure tag |
| petals-node | **far-node** | GPU node instance |
| petals-server.log | **far-node.log** | Node server logs |
| petals-env | **far-mesh-env** | Python virtual environment |
| start-petals-server.sh | **start-far-node.sh** | Node startup script |
| test-petals-client.py | **test-far-client.py** | Client test script |
| monitor-petals.sh | **monitor-far-node.sh** | Monitoring script |

### Configuration

| Instead of | Use | Description |
|-----------|-----|-------------|
| PETALS_* | **FAR_MESH_*** | Environment variable prefix |
| petals.config | **far-mesh.config** | Configuration file |
| --petals-port | **--mesh-port** | CLI argument |

## Rebranded Component Names

### Services & Processes

- **Far Node Server** - The GPU worker process
- **Far Cluster Coordinator** - Multi-node orchestrator
- **Far Discovery Service** - Peer finding and health checks
- **Far Tensor Router** - Activation forwarding engine
- **Far Model Shards** - Distributed model layer chunks

### APIs & Protocols

- **Far Mesh Protocol** - Inter-node communication spec
- **Far Discovery Protocol** - Peer registry and lookup
- **Far Streaming API** - Token-by-token inference interface
- **Far Health Protocol** - Node heartbeat and metrics

### Tools & Scripts

- **far-node** - Start a GPU worker node
- **far-client** - Connect to the mesh for inference
- **far-admin** - Cluster management tool
- **far-monitor** - Real-time mesh visualization
- **far-benchmark** - Performance testing suite

## Directory Structure

```
infra/distributed-inference-rnd/
├── README.md                        # Far Labs Distributed Inference overview
├── QUICKSTART.md                    # Getting started guide
├── CHECKLIST.md                     # Experiment protocol
├── terraform/
│   ├── main.tf                      # Infrastructure provisioning
│   ├── variables.tf                 # Configuration
│   └── outputs.tf                   # Node information
├── scripts/
│   ├── bootstrap.sh                 # Node setup
│   ├── start-far-node.sh           # Start Far Node server
│   ├── test-far-client.py          # Test client
│   ├── monitor-far-node.sh         # Monitoring
│   └── collect-metrics.sh          # Data collection
├── configs/
│   ├── far-mesh.yaml               # Mesh configuration
│   └── models.yaml                 # Model shard config
└── docs/
    ├── ARCHITECTURE.md             # System design
    ├── PROTOCOL_SPEC.md            # Mesh protocol
    └── PHASE1_REPORT.md            # R&D findings
```

## Code Examples

### Starting a Far Node

**Before (Petals)**:
```bash
petals-start-server meta-llama/Llama-2-7b-chat-hf \
    --public_name $PUBLIC_IP:31330
```

**After (Far Labs)**:
```bash
far-node start meta-llama/Llama-2-7b-chat-hf \
    --mesh-addr $PUBLIC_IP:31330 \
    --discovery-mode distributed
```

### Client Connection

**Before (Petals)**:
```python
from petals import AutoDistributedModelForCausalLM
model = AutoDistributedModelForCausalLM.from_pretrained("meta-llama/Llama-2-7b-chat-hf")
```

**After (Far Labs)**:
```python
from farlabs.mesh import DistributedModel
model = DistributedModel.from_pretrained(
    "meta-llama/Llama-2-7b-chat-hf",
    mesh_discovery="far-discovery.farlabs.ai"
)
```

### Environment Variables

**Before (Petals)**:
```bash
export PETALS_DHT_BOOTSTRAP=/ip4/1.2.3.4/tcp/31337
export PETALS_PUBLIC_NAME=mynode.example.com:31330
```

**After (Far Labs)**:
```bash
export FAR_MESH_BOOTSTRAP=far://discovery.farlabs.ai:31337
export FAR_NODE_PUBLIC_ADDR=mynode.example.com:31330
```

## Marketing/Documentation Language

### Avoid

- "Petals-style distributed inference"
- "Using Petals architecture"
- "Based on Petals project"
- "Petals swarm"

### Use Instead

- "Far Labs distributed mesh inference"
- "Proprietary layer distribution architecture"
- "Far Mesh multi-node coordination"
- "Far Cluster"

### Positioning Statements

✅ **GOOD**:
> "Far Labs has developed a proprietary distributed inference mesh that enables model-parallel execution across geographically distributed GPU providers. The Far Mesh protocol coordinates tensor streaming between nodes while maintaining sub-500ms latency per token."

❌ **AVOID**:
> "We're using Petals for distributed inference, which is an open-source project that does model parallelism."

✅ **GOOD**:
> "The Far Discovery Protocol enables automatic peer finding and health monitoring, allowing nodes to join the cluster seamlessly without centralized coordination."

❌ **AVOID**:
> "We use Petals' DHT for node discovery."

## Attribution (for code comments only)

When referencing implementation approaches in code comments:

```python
# Far Mesh tensor streaming implementation
# Inspired by research in distributed model parallelism
# See: BigScience Workshop, Ryabinin et al. (2023)
# Adapted for Far Labs' GPU DePIN architecture
```

## Summary

**Key Principle**: We acknowledge that Petals and Hivemind are excellent reference implementations, but our code, documentation, and marketing should position Far Labs as having developed our own distributed inference technology stack.

**Implementation Strategy**:
1. Use Petals/Hivemind libraries initially for Phase 1 R&D
2. Document findings and architecture decisions in Far Labs terminology
3. Phase 2+: Replace with custom implementations where differentiation matters
4. Maintain compatibility with standard transformer models (HuggingFace)

**Credits**: Keep technical citations in academic/research contexts, but public-facing docs emphasize Far Labs innovation.
