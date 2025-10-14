-- Far Labs PostgreSQL Schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    email VARCHAR(255),
    username VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    kyc_status VARCHAR(20) DEFAULT 'pending',
    tier VARCHAR(20) DEFAULT 'basic'
);

CREATE TABLE IF NOT EXISTS gpu_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id VARCHAR(100) UNIQUE NOT NULL,
    owner_address VARCHAR(42) REFERENCES users(wallet_address),
    gpu_model VARCHAR(100),
    vram_gb INTEGER,
    cuda_cores INTEGER,
    bandwidth_mbps DECIMAL(10, 2),
    location_country VARCHAR(2),
    location_region VARCHAR(100),
    status VARCHAR(20) DEFAULT 'offline',
    reliability_score DECIMAL(5, 2) DEFAULT 80.00,
    tasks_completed INTEGER DEFAULT 0,
    total_earned DECIMAL(20, 8) DEFAULT 0,
    uptime_percentage DECIMAL(5, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    last_seen TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inference_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id),
    node_id UUID REFERENCES gpu_nodes(id),
    model_name VARCHAR(100) NOT NULL,
    prompt TEXT,
    max_tokens INTEGER,
    temperature DECIMAL(3, 2),
    status VARCHAR(20) DEFAULT 'pending',
    tokens_generated INTEGER,
    cost_far DECIMAL(20, 8),
    cost_usd DECIMAL(10, 4),
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    response_time_ms INTEGER
);

CREATE TABLE IF NOT EXISTS staking_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    amount DECIMAL(20, 8) NOT NULL,
    lock_period_days INTEGER NOT NULL,
    apy_at_stake DECIMAL(5, 2),
    status VARCHAR(20) DEFAULT 'active',
    staked_at TIMESTAMP DEFAULT NOW(),
    unlock_at TIMESTAMP,
    withdrawn_at TIMESTAMP,
    rewards_earned DECIMAL(20, 8) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS revenue_streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_type VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id),
    amount_far DECIMAL(20, 8),
    amount_usd DECIMAL(10, 4),
    transaction_hash VARCHAR(66),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gpu_nodes_status ON gpu_nodes(status);
CREATE INDEX IF NOT EXISTS idx_gpu_nodes_owner ON gpu_nodes(owner_address);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON inference_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON inference_tasks(status);
CREATE INDEX IF NOT EXISTS idx_staking_user ON staking_records(user_id);
CREATE INDEX IF NOT EXISTS idx_staking_status ON staking_records(status);
CREATE INDEX IF NOT EXISTS idx_revenue_user ON revenue_streams(user_id);
CREATE INDEX IF NOT EXISTS idx_revenue_type ON revenue_streams(stream_type);
