-- Migration: Add distributed inference tables
-- Description: Schema for Far Mesh distributed inference tracking and payments
-- Created: 2025-10-10

-- ==================================================
-- DISTRIBUTED INFERENCE SESSION TRACKING
-- ==================================================

-- Table: far_mesh_sessions
-- Tracks each distributed inference request
CREATE TABLE IF NOT EXISTS far_mesh_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id VARCHAR(255) UNIQUE NOT NULL,
    user_wallet VARCHAR(42) NOT NULL,
    model_id VARCHAR(255) NOT NULL,
    prompt_text TEXT NOT NULL,

    -- Generation parameters
    max_tokens INTEGER NOT NULL,
    temperature DECIMAL(3, 2) NOT NULL DEFAULT 0.7,
    top_p DECIMAL(3, 2) NOT NULL DEFAULT 0.9,

    -- Session metrics
    tokens_generated INTEGER DEFAULT 0,
    total_cost_far DECIMAL(20, 8) DEFAULT 0,

    -- Timing
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP,
    failed_at TIMESTAMP,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, completed, failed, cancelled
    error_message TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for querying by user
CREATE INDEX idx_far_mesh_sessions_user_wallet ON far_mesh_sessions(user_wallet);

-- Index for querying by status
CREATE INDEX idx_far_mesh_sessions_status ON far_mesh_sessions(status);

-- Index for querying by timestamp
CREATE INDEX idx_far_mesh_sessions_created_at ON far_mesh_sessions(created_at DESC);

-- ==================================================
-- GPU NODE REGISTRY
-- ==================================================

-- Table: far_nodes
-- Registry of GPU providers serving models in the Far Mesh
CREATE TABLE IF NOT EXISTS far_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id VARCHAR(255) UNIQUE NOT NULL, -- Peer ID from Hivemind DHT
    wallet_address VARCHAR(42) NOT NULL,

    -- Hardware info
    gpu_model VARCHAR(100),
    vram_gb INTEGER,
    cpu_cores INTEGER,
    ram_gb INTEGER,

    -- Location
    location VARCHAR(100), -- City, Country
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Network
    public_addr VARCHAR(255), -- Public IP:port or domain
    dht_addr VARCHAR(500), -- Full DHT multiaddr

    -- Status
    is_active BOOLEAN DEFAULT true,
    last_seen TIMESTAMP DEFAULT NOW(),
    uptime_seconds BIGINT DEFAULT 0,

    -- Metrics
    total_sessions_served BIGINT DEFAULT 0,
    total_tokens_served BIGINT DEFAULT 0,
    total_earned_far DECIMAL(20, 8) DEFAULT 0,

    -- Registration
    registered_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for finding active nodes
CREATE INDEX idx_far_nodes_active ON far_nodes(is_active, last_seen DESC);

-- Index for node lookup by wallet
CREATE INDEX idx_far_nodes_wallet ON far_nodes(wallet_address);

-- ==================================================
-- NODE MODEL SERVING
-- ==================================================

-- Table: far_node_models
-- Tracks which models each node is serving
CREATE TABLE IF NOT EXISTS far_node_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID NOT NULL REFERENCES far_nodes(id) ON DELETE CASCADE,
    model_id VARCHAR(255) NOT NULL,

    -- Layer distribution
    layers_start INTEGER, -- First layer this node serves
    layers_end INTEGER,   -- Last layer this node serves
    total_layers INTEGER, -- Total layers in model

    -- Capabilities
    quantization VARCHAR(20), -- fp16, int8, int4
    max_batch_size INTEGER DEFAULT 1,

    -- Performance metrics
    avg_latency_ms INTEGER,
    throughput_tokens_per_sec DECIMAL(10, 2),

    -- Status
    is_serving BOOLEAN DEFAULT true,
    started_serving_at TIMESTAMP DEFAULT NOW(),
    stopped_serving_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(node_id, model_id)
);

-- Index for finding nodes serving a specific model
CREATE INDEX idx_far_node_models_model_id ON far_node_models(model_id, is_serving);

-- ==================================================
-- SESSION NODE CONTRIBUTIONS
-- ==================================================

-- Table: far_session_contributions
-- Tracks which nodes contributed to each inference session (for payment)
CREATE TABLE IF NOT EXISTS far_session_contributions (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES far_mesh_sessions(id) ON DELETE CASCADE,
    node_id UUID NOT NULL REFERENCES far_nodes(id),

    -- Contribution metrics
    tokens_contributed INTEGER NOT NULL DEFAULT 0,
    layers_processed INTEGER[], -- Array of layer numbers processed

    -- Payment
    payment_far DECIMAL(20, 8) NOT NULL DEFAULT 0,
    paid_at TIMESTAMP,
    payment_tx_hash VARCHAR(66), -- Blockchain transaction hash

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(session_id, node_id)
);

-- Index for finding contributions by session
CREATE INDEX idx_far_session_contributions_session ON far_session_contributions(session_id);

-- Index for finding contributions by node
CREATE INDEX idx_far_session_contributions_node ON far_session_contributions(node_id);

-- Index for unpaid contributions
CREATE INDEX idx_far_session_contributions_unpaid ON far_session_contributions(paid_at) WHERE paid_at IS NULL;

-- ==================================================
-- PAYMENT BATCHES
-- ==================================================

-- Table: far_payment_batches
-- Groups multiple node payments into blockchain transactions
CREATE TABLE IF NOT EXISTS far_payment_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Batch info
    total_nodes INTEGER NOT NULL,
    total_amount_far DECIMAL(20, 8) NOT NULL,

    -- Blockchain
    tx_hash VARCHAR(66),
    block_number BIGINT,
    gas_used BIGINT,
    gas_price_gwei DECIMAL(20, 8),

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, submitted, confirmed, failed
    error_message TEXT,

    -- Timing
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMP,
    confirmed_at TIMESTAMP
);

-- Index for querying batches by status
CREATE INDEX idx_far_payment_batches_status ON far_payment_batches(status);

-- ==================================================
-- MESH NETWORK METRICS
-- ==================================================

-- Table: far_mesh_metrics
-- Time-series metrics for the Far Mesh network
CREATE TABLE IF NOT EXISTS far_mesh_metrics (
    id BIGSERIAL PRIMARY KEY,
    recorded_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Network stats
    total_nodes INTEGER NOT NULL,
    active_nodes INTEGER NOT NULL,
    total_models INTEGER NOT NULL,

    -- Usage stats
    active_sessions INTEGER NOT NULL,
    sessions_last_hour INTEGER NOT NULL,
    tokens_generated_last_hour BIGINT NOT NULL,

    -- Performance
    avg_latency_ms INTEGER,
    p95_latency_ms INTEGER,
    p99_latency_ms INTEGER,

    -- Financial
    far_paid_last_hour DECIMAL(20, 8) NOT NULL DEFAULT 0
);

-- Index for time-series queries
CREATE INDEX idx_far_mesh_metrics_recorded_at ON far_mesh_metrics(recorded_at DESC);

-- ==================================================
-- VIEWS FOR ANALYTICS
-- ==================================================

-- View: active_far_nodes
-- Shows currently active GPU nodes with latest stats
CREATE OR REPLACE VIEW active_far_nodes AS
SELECT
    n.node_id,
    n.wallet_address,
    n.gpu_model,
    n.vram_gb,
    n.location,
    n.total_sessions_served,
    n.total_tokens_served,
    n.total_earned_far,
    n.last_seen,
    COUNT(nm.id) as models_serving,
    ARRAY_AGG(nm.model_id) FILTER (WHERE nm.is_serving) as active_models
FROM far_nodes n
LEFT JOIN far_node_models nm ON n.id = nm.node_id AND nm.is_serving = true
WHERE n.is_active = true
    AND n.last_seen > NOW() - INTERVAL '5 minutes'
GROUP BY n.id;

-- View: node_earnings_summary
-- Earnings per node for reporting
CREATE OR REPLACE VIEW node_earnings_summary AS
SELECT
    n.node_id,
    n.wallet_address,
    COUNT(DISTINCT c.session_id) as sessions_contributed,
    SUM(c.tokens_contributed) as total_tokens,
    SUM(c.payment_far) as total_earned,
    SUM(c.payment_far) FILTER (WHERE c.paid_at IS NULL) as pending_payment,
    MAX(c.created_at) as last_contribution
FROM far_nodes n
LEFT JOIN far_session_contributions c ON n.id = c.node_id
GROUP BY n.id;

-- ==================================================
-- FUNCTIONS
-- ==================================================

-- Function: update_node_last_seen
-- Updates node last_seen timestamp (called by heartbeat)
CREATE OR REPLACE FUNCTION update_node_last_seen(p_node_id VARCHAR)
RETURNS VOID AS $$
BEGIN
    UPDATE far_nodes
    SET last_seen = NOW(),
        updated_at = NOW()
    WHERE node_id = p_node_id;
END;
$$ LANGUAGE plpgsql;

-- Function: finalize_session
-- Finalizes a completed inference session
CREATE OR REPLACE FUNCTION finalize_session(
    p_session_id UUID,
    p_tokens_generated INTEGER,
    p_total_cost_far DECIMAL
)
RETURNS VOID AS $$
BEGIN
    UPDATE far_mesh_sessions
    SET tokens_generated = p_tokens_generated,
        total_cost_far = p_total_cost_far,
        completed_at = NOW(),
        status = 'completed',
        updated_at = NOW()
    WHERE id = p_session_id;

    -- Update node statistics
    UPDATE far_nodes n
    SET total_sessions_served = n.total_sessions_served + 1,
        total_tokens_served = n.total_tokens_served + COALESCE(c.tokens_contributed, 0),
        total_earned_far = n.total_earned_far + COALESCE(c.payment_far, 0),
        updated_at = NOW()
    FROM far_session_contributions c
    WHERE c.session_id = p_session_id
        AND c.node_id = n.id;
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- COMMENTS
-- ==================================================

COMMENT ON TABLE far_mesh_sessions IS 'Distributed inference sessions using Far Mesh network';
COMMENT ON TABLE far_nodes IS 'GPU provider nodes in the Far Mesh network';
COMMENT ON TABLE far_node_models IS 'Models served by each GPU node';
COMMENT ON TABLE far_session_contributions IS 'Node contributions to inference sessions for payment tracking';
COMMENT ON TABLE far_payment_batches IS 'Batched payments to GPU providers';
COMMENT ON TABLE far_mesh_metrics IS 'Time-series metrics for network monitoring';

-- ==================================================
-- GRANTS
-- ==================================================

-- Grant access to application user (adjust username as needed)
GRANT SELECT, INSERT, UPDATE ON far_mesh_sessions TO farlabs_admin;
GRANT SELECT, INSERT, UPDATE ON far_nodes TO farlabs_admin;
GRANT SELECT, INSERT, UPDATE ON far_node_models TO farlabs_admin;
GRANT SELECT, INSERT, UPDATE ON far_session_contributions TO farlabs_admin;
GRANT SELECT, INSERT, UPDATE ON far_payment_batches TO farlabs_admin;
GRANT SELECT, INSERT ON far_mesh_metrics TO farlabs_admin;

GRANT USAGE, SELECT ON SEQUENCE far_session_contributions_id_seq TO farlabs_admin;
GRANT USAGE, SELECT ON SEQUENCE far_mesh_metrics_id_seq TO farlabs_admin;

GRANT SELECT ON active_far_nodes TO farlabs_admin;
GRANT SELECT ON node_earnings_summary TO farlabs_admin;
