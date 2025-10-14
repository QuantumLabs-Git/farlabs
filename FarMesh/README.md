# FarMesh - Far Labs Distributed Inference Library

**FarMesh** is Far Labs' fork and modernization of the [Petals](https://github.com/bigscience-workshop/petals) distributed transformer inference library.

## Why FarMesh?

The original Petals library (last updated 2023) has dependency conflicts with modern Python packages:
- Uses `transformers==4.34.1` (we need `>=4.39.0`)
- Incompatible with `pydantic>=2.0` (required by modern FastAPI)
- Old versions of web3, eth-account, and other dependencies

FarMesh updates Petals to work with:
- ✅ Pydantic v2 (>=2.6.0)
- ✅ Modern transformers (>=4.39.0)
- ✅ Latest PyTorch versions
- ✅ Far Labs branding and terminology

## Architecture

```
┌────────────────────────────────────────────────────────┐
│                   FarMesh Library                       │
│  (Wrapper + Updates to Petals for modern dependencies) │
└────────────────────────────────────────────────────────┘
                          │
                          ├─ API Layer (Far Labs branding)
                          ├─ Updated Petals core (modern deps)
                          └─ Hivemind DHT integration
```

## Installation

```bash
pip install farmesh
```

## Usage

### Basic Distributed Inference

```python
from farmesh import DistributedInferenceClient

client = DistributedInferenceClient(
    model_id="meta-llama/Llama-2-7b-chat-hf",
    dht_bootstrap="/ip4/petals.dev/tcp/31337"
)

# Generate text
response = client.generate(
    prompt="Hello, how are you?",
    max_tokens=100
)
print(response)
```

### Running a Far Node (GPU Provider)

```python
from farmesh import FarNode

node = FarNode(
    model_id="meta-llama/Llama-2-7b-chat-hf",
    dht_bootstrap="/ip4/petals.dev/tcp/31337",
    device="cuda:0"
)

node.run()  # Start serving model layers
```

## Key Differences from Petals

| Petals | FarMesh |
|--------|---------|
| `petals.RemoteSequential` | `farmesh.DistributedModel` |
| `run_server()` | `FarNode.run()` |
| `petals.AutoDistributedModelForCausalLM` | `farmesh.DistributedInferenceClient` |
| transformers 4.34.1 | transformers >= 4.39.0 |
| No pydantic support | Pydantic v2 compatible |

## Deployment

FarMesh is used by:
- **Far Mesh Coordinator** - Main inference API service
- **Far Node Server** - GPU provider software
- **Python SDK** - Client library for developers

## Development

### Project Structure

```
FarMesh/
├── README.md (this file)
├── setup.cfg - Updated dependencies
├── pyproject.toml - Build configuration
├── src/
│   └── farmesh/
│       ├── __init__.py - Main exports
│       ├── client.py - Inference client
│       ├── node.py - GPU node server
│       ├── dht_utils.py - DHT helpers
│       └── (copied/updated Pet als source)
```

### Building

```bash
python -m build
pip install dist/farmesh-*.whl
```

## Terminology Mapping

| Concept | Petals Term | FarMesh Term |
|---------|------------|--------------|
| Distributed network | "Petals Swarm" | "Far Mesh Network" |
| GPU provider | "Server" | "Far Node" |
| Model layers | "Blocks" | "Layers" (unchanged) |
| Network discovery | "DHT" | "DHT" (unchanged) |

## License

MIT License (inherited from Petals)

## Credits

FarMesh is based on [Petals](https://github.com/bigscience-workshop/petals) by BigScience Workshop.
Updated and maintained by Far Labs for modern dependency compatibility.
