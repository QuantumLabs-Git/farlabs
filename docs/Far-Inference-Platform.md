# Far Inference Platform Overview

This document captures the FarMesh-derived inference stack customized for Far Labs, including component architecture, model catalog priorities, pricing levers, and rebranding strategy.

---

## 1. System Architecture

### Backend (Python-first)
- **FastAPI** service orchestrating inference requests, JWT authentication, and WebSocket endpoints.
- **FarMesh core fork** (now `farlabs_inference`) with payment-aware server and client layers.
- **Web3.py** integration for Binance Smart Chain contracts (`InferencePayment`, `NodeRegistry`, `FARToken`).
- **Redis + Celery** pipeline for asynchronous payment verification, rating adjustments, and task queueing.
- **PostgreSQL (RDS)** storing users, GPU nodes, billing records, staking metrics.
- **MongoDB Atlas** archiving inference logs, performance metrics, and user analytics.

### Frontend (Next.js 14)
- **Next.js App Router + TypeScript** with Tailwind + shadcn/ui for high-tech UI.
- **Zustand** state stores for inference sessions, pricing calculators, and admin consoles.
- **wagmi + viem** wallet integrations (BSC, WalletConnect, Coinbase).
- **Socket.io-client** for streaming inference responses and provider telemetry.

### Infrastructure (AWS)
- ECS Fargate services behind an Application Load Balancer.
- CloudFront CDN, S3 model storage, Route53 DNS, AWS WAF & Shield.
- ElastiCache Redis, RDS PostgreSQL, private VPC networking with segmented subnets.

---

## 2. Model Catalog Strategy

### Priority 1 – Flagship models (launch-ready)
- Llama 3.1 405B / 70B / 11B Vision
- Mixtral 8x22B, Mistral Large 2 (123B), Mistral 7B v0.3
- Gemma 2 (27B & 9B), Codestral 22B

### Priority 2 – Specialized & long-context
- DeepSeek-Coder V2 236B, Qwen 2.5 72B
- Yi-34B-200K, Nous Hermes 2 Mixtral 8x7B
- BioMistral 7B, StarCoder2 15B

### Priority 3 – Community voted additions
- Falcon 180B, Vicuna 33B, Aya 35B
- OpenHermes 2.5, Bloom 176B, domain-specific finetunes

The Next.js inference page exposes this catalog with categories, ideal use cases, and future roadmap hooks.

---

## 3. Pricing & Unit Economics

### Cost structure
| Item | Share | Notes |
|------|-------|-------|
| GPU providers | 60% | Reliability-adjusted payout (±10%) |
| Token holders | 20% | Distributed to stakers |
| Far Labs platform | 20% | Covers AWS + development + margin |

### Target pricing (per 1M tokens)
- 3B–7B models: **$0.10 – $0.50**
- 8B–70B models: **$1.00 – $3.00**
- 70B–180B+ models: **$5.00 – $15.00**
- Coding models: **$2.00 – $5.00**

Compared to centralized providers (OpenAI, Anthropic), the goal is **50–90% savings**.

### Automated price oracle
- Monitors competitor APIs, GPU supply, demand volume.
- Adjusts prices ±10% based on utilization thresholds.
- Ensures discounts remain at least 50% below centralized offerings.

### Discounts & incentives
- **Staking discounts** up to 50%.
- **Prepaid packages** (10–50% bonus tokens).
- **Batch processing discounts** (10–30%).
- **Quantization tiers** (FP16 → INT4) reduce cost by up to 60%.
- **Referral program** (10% lifetime discount for referrer and new user in month one).

---

## 4. Reliability & Rating Engine

**Metrics tracked**: uptime %, latency percentiles, tokens/sec throughput, inference accuracy audits, customer satisfaction pulses.

**Score formula**:
```
Base Score = (Uptime × 0.4) + (Speed × 0.3) + (Accuracy × 0.2) + (Satisfaction × 0.1)
Bonus / Penalty = (Base Score − 0.8) × 50%  (capped at ±10%)
Final Payment = Base × (1 + Bonus / Penalty)
```

Scores influence payout adjustments, marketplace ranking, and staking boosts.

---

## 5. FarMesh Rebranding Guidelines

| Original (FarMesh) | Far Labs Name |
|-------------------|---------------|
| `farmesh` package | `farlabs_inference` |
| FarMesh server | Far Labs Node |
| RemoteSequential | DistributedPipeline |
| hivemind DHT | FarNet |
| run_server CLI | start_node |
| swarm terminology | network |

### Instructions
1. Fork the FarMesh repository and run the automated rebranding script (see `rebranding_script.py` in docs).
2. Update Docker images (`farlabs/inference:latest`) and environment variables (`FARLABS_NODE_NAME`, etc.).
3. Replace user-facing strings (e.g., “Joining the swarm” → “Connecting to Far Labs Network”).
4. Maintain MIT attribution with `LICENSE_ATTRIBUTION.md`.

---

## 6. Deployment Phases

1. **Phase 1 (Months 1–2)**  
   - BSC testnet contracts, beta GPU provider cohort, minimal dashboard.
2. **Phase 2 (Months 3–4)**  
   - Mainnet launch, fiat on-ramp, native provider installers, public beta.
3. **Phase 3 (Months 5–6)**  
   - Mobile app, fine-tuning services, enterprise SLAs, governance rollout.

---

## 7. Competitive Advantages
- **Price leadership**: 50–90% cheaper than OpenAI/Anthropic.
- **Model variety**: One API for 20+ open models with quantization options.
- **Privacy & composability**: No prompt logging, private pools, composable routing.
- **Provider profitability**: Consumer GPU operators earn significant margins.
- **Token utility**: $FAR drives staking, discounts, governance, and revenue sharing.

This document should be referenced alongside `docs/AWS-Deployment-Guide.md` and `docs/Smart-Contracts.md` during implementation and go-to-market planning.
