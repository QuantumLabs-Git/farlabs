## Monitoring & Analytics Blueprint

This document outlines the observability stack for Far Labs across metrics, traces, and logs.

### Logging
- **Application Logs**: ECS tasks write to CloudWatch Logs (`/ecs/farlabs-*`). Use subscription filters to forward to Amazon Kinesis Firehose → S3/Parquet for long-term storage.
- **Frontend**: Next.js logs streamed via stdout; integrate with Datadog RUM or Sentry for client-side telemetry.
- **Smart Contracts**: Index BSC events via The Graph or custom Web3 indexer pushing to DynamoDB for time-series analytics.

### Metrics
- **CloudWatch Dashboards** for ECS CPU/memory, ALB latency, RDS connections, Redis engine metrics.
- **Prometheus/Grafana** (Amazon Managed Prometheus + Amazon Managed Grafana) for GPU node metrics, inference throughput, staking payouts.
- **Custom Metrics**:
  - `InferenceTokensGenerated` – count of tokens emitted by the inference service.
  - `GPUNodeReliability` – average reliability across nodes (pushed via CloudWatch embedded metrics).
  - `RevenuePerStream` – aggregated USD per product vertical.

### Tracing
- Instrument FastAPI (via `opentelemetry-instrumentation-fastapi`) and Node services (`@opentelemetry/sdk-node`) with AWS X-Ray exporters.
- Propagate `traceparent` headers through API Gateway for end-to-end correlation.

### Alerting
- Set CloudWatch alarms for:
  - ECS service CPU > 75% for 5 minutes
  - RDS free storage < 15%
  - Redis memory usage > 80%
  - API Gateway 5xx error rate > 2% for 10 minutes
- Route alerts to SNS → PagerDuty / Slack.

### Analytics
- Maintain MongoDB collections (`inference_logs`, `network_metrics`, `user_activity`) as defined in the technical specification.
- Aggregate daily revenue and staking summaries via scheduled AWS Glue jobs.
- Feed dashboards to business stakeholders via Amazon QuickSight with row-level security tied to user tiers.
