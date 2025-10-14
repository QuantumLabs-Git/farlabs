-- Far Labs Database Initialization Script
-- PostgreSQL 15.5

-- Create database schema for Far Labs platform
-- This provides persistent storage for all platform data

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (wallet-based authentication)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(64) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    session_tag VARCHAR(64),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_users_wallet ON users(wallet_address);

-- Payments ledger (balances and transactions)
CREATE TABLE IF NOT EXISTS payment_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(64) UNIQUE NOT NULL,
    available_balance DECIMAL(20, 8) DEFAULT 0 NOT NULL CHECK (available_balance >= 0),
    escrowed_balance DECIMAL(20, 8) DEFAULT 0 NOT NULL CHECK (escrowed_balance >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_balances_wallet ON payment_balances(wallet_address);

-- Payment transactions history
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(64) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('credit', 'debit')),
    amount DECIMAL(20, 8) NOT NULL CHECK (amount > 0),
    asset VARCHAR(10) DEFAULT 'FAR',
    reference VARCHAR(120),
    status VARCHAR(20) DEFAULT 'confirmed',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_transactions_wallet ON payment_transactions(wallet_address);
CREATE INDEX idx_payment_transactions_created ON payment_transactions(created_at DESC);
CREATE INDEX idx_payment_transactions_type ON payment_transactions(transaction_type);

-- Staking positions
CREATE TABLE IF NOT EXISTS staking_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(64) UNIQUE NOT NULL,
    amount DECIMAL(20, 8) DEFAULT 0 NOT NULL CHECK (amount >= 0),
    lock_period_days INTEGER DEFAULT 0 NOT NULL CHECK (lock_period_days >= 0),
    rewards_earned DECIMAL(20, 8) DEFAULT 0 NOT NULL CHECK (rewards_earned >= 0),
    started_at TIMESTAMP WITH TIME ZONE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_staking_positions_wallet ON staking_positions(wallet_address);

-- Staking history
CREATE TABLE IF NOT EXISTS staking_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(64) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    amount DECIMAL(20, 8) NOT NULL CHECK (amount > 0),
    lock_period_days INTEGER,
    status VARCHAR(20) DEFAULT 'confirmed',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_staking_history_wallet ON staking_history(wallet_address);
CREATE INDEX idx_staking_history_created ON staking_history(created_at DESC);

-- GPU nodes
CREATE TABLE IF NOT EXISTS gpu_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    node_id VARCHAR(50) UNIQUE NOT NULL,
    wallet_address VARCHAR(64) NOT NULL,
    gpu_model VARCHAR(100) NOT NULL,
    vram_gb INTEGER NOT NULL CHECK (vram_gb > 0),
    bandwidth_gbps DECIMAL(10, 2) NOT NULL CHECK (bandwidth_gbps >= 0),
    location VARCHAR(100),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'busy', 'offline')),
    score DECIMAL(5, 2) DEFAULT 100.0 CHECK (score >= 0 AND score <= 100),
    tasks_completed INTEGER DEFAULT 0 CHECK (tasks_completed >= 0),
    uptime_seconds BIGINT DEFAULT 0 CHECK (uptime_seconds >= 0),
    temperature_c DECIMAL(5, 2),
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_gpu_nodes_node_id ON gpu_nodes(node_id);
CREATE INDEX idx_gpu_nodes_wallet ON gpu_nodes(wallet_address);
CREATE INDEX idx_gpu_nodes_status ON gpu_nodes(status);
CREATE INDEX idx_gpu_nodes_score ON gpu_nodes(score DESC);

-- Inference tasks
CREATE TABLE IF NOT EXISTS inference_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id VARCHAR(100) UNIQUE NOT NULL,
    user_address VARCHAR(64) NOT NULL,
    node_id VARCHAR(50),
    model VARCHAR(100) NOT NULL,
    prompt TEXT NOT NULL,
    max_tokens INTEGER NOT NULL CHECK (max_tokens > 0),
    temperature DECIMAL(3, 2) NOT NULL CHECK (temperature >= 0 AND temperature <= 2),
    status VARCHAR(20) DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'timeout')),
    result TEXT,
    tokens_generated INTEGER,
    cost DECIMAL(20, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_inference_tasks_task_id ON inference_tasks(task_id);
CREATE INDEX idx_inference_tasks_user ON inference_tasks(user_address);
CREATE INDEX idx_inference_tasks_status ON inference_tasks(status);
CREATE INDEX idx_inference_tasks_created ON inference_tasks(created_at DESC);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_balances_updated_at BEFORE UPDATE ON payment_balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staking_positions_updated_at BEFORE UPDATE ON staking_positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inference_tasks_updated_at BEFORE UPDATE ON inference_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create database user for application (optional, but recommended)
-- DO $$
-- BEGIN
--     IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'farlabs_app') THEN
--         CREATE USER farlabs_app WITH PASSWORD 'ChangeMe456!';
--         GRANT CONNECT ON DATABASE farlabs TO farlabs_app;
--         GRANT USAGE ON SCHEMA public TO farlabs_app;
--         GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO farlabs_app;
--         GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO farlabs_app;
--         ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO farlabs_app;
--         ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO farlabs_app;
--     END IF;
-- END
-- $$;

-- Insert sample data for testing (optional)
-- INSERT INTO users (wallet_address, session_tag) VALUES
--     ('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 'demo-session')
-- ON CONFLICT (wallet_address) DO NOTHING;

-- INSERT INTO payment_balances (wallet_address, available_balance) VALUES
--     ('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 1000.0)
-- ON CONFLICT (wallet_address) DO NOTHING;

-- Grant permissions to application user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO CURRENT_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO CURRENT_USER;

-- View to check database health
CREATE OR REPLACE VIEW database_stats AS
SELECT
    (SELECT COUNT(*) FROM users) AS total_users,
    (SELECT COUNT(*) FROM gpu_nodes) AS total_gpu_nodes,
    (SELECT COUNT(*) FROM inference_tasks) AS total_inference_tasks,
    (SELECT SUM(available_balance) FROM payment_balances) AS total_available_balance,
    (SELECT SUM(escrowed_balance) FROM payment_balances) AS total_escrowed_balance,
    (SELECT SUM(amount) FROM staking_positions) AS total_staked;

-- Database initialization complete
SELECT 'Database initialized successfully' AS status;
