-- Add Feature Connections System
-- Enables tracking of explicit relationships between features
-- Migration: 20250113000001_add_feature_connections_table.sql

-- ========== FEATURE CONNECTIONS TABLE ==========

CREATE TABLE IF NOT EXISTS feature_connections (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'default',
    workspace_id TEXT NOT NULL,

    -- Connection details
    source_feature_id TEXT NOT NULL,
    target_feature_id TEXT NOT NULL,

    -- Relationship type
    connection_type TEXT NOT NULL CHECK (connection_type IN (
        'dependency',        -- Source depends on target
        'blocks',           -- Source blocks target
        'enables',          -- Source enables target
        'complements',      -- Features work well together
        'conflicts',        -- Features conflict with each other
        'relates_to',       -- General relationship
        'duplicates',       -- Potential duplicate features
        'supersedes'        -- Source replaces target
    )),

    -- Relationship strength (0.0 to 1.0)
    strength NUMERIC(3,2) DEFAULT 0.5 CHECK (strength >= 0 AND strength <= 1.0),

    -- Direction indicator
    is_bidirectional BOOLEAN DEFAULT false,

    -- Metadata
    reason TEXT,                           -- Why this connection exists
    evidence JSONB DEFAULT '[]'::jsonb,    -- Supporting evidence (common keywords, user notes, AI suggestions)
    confidence NUMERIC(3,2) DEFAULT 0.5,   -- Confidence score (0.0 to 1.0)

    -- Discovery method
    discovered_by TEXT CHECK (discovered_by IN ('user', 'ai', 'system', 'correlation_engine')),
    discovered_at TIMESTAMPTZ DEFAULT NOW(),

    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'rejected', 'pending_review')),

    -- User interaction
    user_confirmed BOOLEAN DEFAULT false,
    user_rejected BOOLEAN DEFAULT false,
    last_reviewed_at TIMESTAMPTZ,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== INDEXES ==========

-- Primary query patterns
CREATE INDEX IF NOT EXISTS idx_connections_source ON feature_connections(source_feature_id);
CREATE INDEX IF NOT EXISTS idx_connections_target ON feature_connections(target_feature_id);
CREATE INDEX IF NOT EXISTS idx_connections_workspace ON feature_connections(workspace_id);
CREATE INDEX IF NOT EXISTS idx_connections_user ON feature_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_type ON feature_connections(connection_type);
CREATE INDEX IF NOT EXISTS idx_connections_status ON feature_connections(status);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_connections_source_type ON feature_connections(source_feature_id, connection_type);
CREATE INDEX IF NOT EXISTS idx_connections_workspace_status ON feature_connections(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_connections_discovered_by ON feature_connections(discovered_by);

-- Bidirectional lookup optimization
CREATE INDEX IF NOT EXISTS idx_connections_bidirectional ON feature_connections(source_feature_id, target_feature_id);

-- JSONB evidence search
CREATE INDEX IF NOT EXISTS idx_connections_evidence ON feature_connections USING GIN(evidence);

-- ========== CONSTRAINTS ==========

-- Prevent self-connections
ALTER TABLE feature_connections ADD CONSTRAINT no_self_connection
    CHECK (source_feature_id != target_feature_id);

-- Unique connection per direction (prevent duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS idx_connections_unique ON feature_connections(
    source_feature_id,
    target_feature_id,
    connection_type
) WHERE status != 'rejected';

-- ========== HELPER FUNCTIONS ==========

-- Function to get all connections for a feature (both incoming and outgoing)
CREATE OR REPLACE FUNCTION get_feature_connections(feature_id_param TEXT)
RETURNS TABLE (
    connection_id TEXT,
    related_feature_id TEXT,
    connection_type TEXT,
    direction TEXT,
    strength NUMERIC,
    reason TEXT,
    confidence NUMERIC,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    -- Outgoing connections
    SELECT
        id as connection_id,
        target_feature_id as related_feature_id,
        connection_type,
        'outgoing'::TEXT as direction,
        strength,
        reason,
        confidence,
        status
    FROM feature_connections
    WHERE source_feature_id = feature_id_param
        AND status = 'active'

    UNION ALL

    -- Incoming connections
    SELECT
        id as connection_id,
        source_feature_id as related_feature_id,
        connection_type,
        'incoming'::TEXT as direction,
        strength,
        reason,
        confidence,
        status
    FROM feature_connections
    WHERE target_feature_id = feature_id_param
        AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Function to calculate connection count for a feature
CREATE OR REPLACE FUNCTION get_connection_count(feature_id_param TEXT)
RETURNS INTEGER AS $$
DECLARE
    count_result INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_result
    FROM feature_connections
    WHERE (source_feature_id = feature_id_param OR target_feature_id = feature_id_param)
        AND status = 'active';

    RETURN count_result;
END;
$$ LANGUAGE plpgsql;

-- Function to check if two features are connected
CREATE OR REPLACE FUNCTION are_features_connected(
    feature_a_id TEXT,
    feature_b_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    connection_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM feature_connections
        WHERE ((source_feature_id = feature_a_id AND target_feature_id = feature_b_id)
            OR (source_feature_id = feature_b_id AND target_feature_id = feature_a_id))
            AND status = 'active'
    ) INTO connection_exists;

    RETURN connection_exists;
END;
$$ LANGUAGE plpgsql;

-- Function to create bidirectional connection
CREATE OR REPLACE FUNCTION create_bidirectional_connection(
    p_user_id TEXT,
    p_workspace_id TEXT,
    p_feature_a_id TEXT,
    p_feature_b_id TEXT,
    p_connection_type TEXT,
    p_strength NUMERIC DEFAULT 0.5,
    p_reason TEXT DEFAULT '',
    p_confidence NUMERIC DEFAULT 0.5,
    p_discovered_by TEXT DEFAULT 'user'
)
RETURNS TEXT AS $$
DECLARE
    connection_id TEXT;
    reverse_connection_id TEXT;
BEGIN
    -- Create primary connection
    connection_id := (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT::TEXT;

    INSERT INTO feature_connections (
        id, user_id, workspace_id,
        source_feature_id, target_feature_id,
        connection_type, strength, is_bidirectional,
        reason, confidence, discovered_by, status
    ) VALUES (
        connection_id, p_user_id, p_workspace_id,
        p_feature_a_id, p_feature_b_id,
        p_connection_type, p_strength, true,
        p_reason, p_confidence, p_discovered_by, 'active'
    );

    -- Create reverse connection
    reverse_connection_id := (EXTRACT(EPOCH FROM NOW()) * 1000 + 1)::BIGINT::TEXT;

    INSERT INTO feature_connections (
        id, user_id, workspace_id,
        source_feature_id, target_feature_id,
        connection_type, strength, is_bidirectional,
        reason, confidence, discovered_by, status
    ) VALUES (
        reverse_connection_id, p_user_id, p_workspace_id,
        p_feature_b_id, p_feature_a_id,
        p_connection_type, p_strength, true,
        p_reason, p_confidence, p_discovered_by, 'active'
    );

    RETURN connection_id;
END;
$$ LANGUAGE plpgsql;

-- ========== TRIGGER FOR UPDATED_AT ==========

CREATE OR REPLACE FUNCTION update_connection_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_connection_timestamp
    BEFORE UPDATE ON feature_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_connection_updated_at();

-- ========== GRANT PERMISSIONS ==========

GRANT ALL ON TABLE feature_connections TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_feature_connections(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_connection_count(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION are_features_connected(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_bidirectional_connection(TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, NUMERIC, TEXT) TO anon, authenticated;

-- ========== COMMENTS FOR DOCUMENTATION ==========

COMMENT ON TABLE feature_connections IS 'Stores explicit relationships between features for dependency tracking and correlation analysis';
COMMENT ON COLUMN feature_connections.connection_type IS 'Type of relationship: dependency, blocks, enables, complements, conflicts, relates_to, duplicates, supersedes';
COMMENT ON COLUMN feature_connections.strength IS 'Relationship strength from 0.0 (weak) to 1.0 (strong)';
COMMENT ON COLUMN feature_connections.is_bidirectional IS 'True if connection applies in both directions';
COMMENT ON COLUMN feature_connections.evidence IS 'JSONB array of evidence supporting this connection (keywords, user notes, AI reasoning)';
COMMENT ON COLUMN feature_connections.confidence IS 'Confidence score from 0.0 (uncertain) to 1.0 (certain)';
COMMENT ON COLUMN feature_connections.discovered_by IS 'How this connection was discovered: user, ai, system, correlation_engine';
COMMENT ON COLUMN feature_connections.status IS 'Connection status: active, inactive, rejected, pending_review';

-- ========== MIGRATION COMPLETE ==========

DO $$
BEGIN
    RAISE NOTICE 'Feature connections migration completed successfully';
    RAISE NOTICE 'Created table: feature_connections';
    RAISE NOTICE 'Created 10 indexes for optimized queries';
    RAISE NOTICE 'Created 4 helper functions for connection management';
    RAISE NOTICE 'Created 1 trigger for timestamp management';
END $$;
