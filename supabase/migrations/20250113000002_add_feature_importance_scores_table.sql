-- Add Feature Importance Scoring System
-- Enables calculation and tracking of feature importance metrics
-- Migration: 20250113000002_add_feature_importance_scores_table.sql

-- ========== FEATURE IMPORTANCE SCORES TABLE ==========

CREATE TABLE IF NOT EXISTS feature_importance_scores (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'default',
    workspace_id TEXT NOT NULL,
    feature_id TEXT NOT NULL,

    -- Overall importance score (0.0 to 100.0)
    overall_score NUMERIC(5,2) DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 100),

    -- Component scores (each 0.0 to 100.0)
    dependency_score NUMERIC(5,2) DEFAULT 0,      -- Based on how many features depend on this
    blocking_score NUMERIC(5,2) DEFAULT 0,        -- Based on how many features this blocks
    connection_score NUMERIC(5,2) DEFAULT 0,      -- Based on total connections
    business_value_score NUMERIC(5,2) DEFAULT 0,  -- Based on business_value field
    priority_score NUMERIC(5,2) DEFAULT 0,        -- Based on priority field
    workflow_score NUMERIC(5,2) DEFAULT 0,        -- Based on workflow stage position
    complexity_score NUMERIC(5,2) DEFAULT 0,      -- Based on difficulty and effort
    correlation_score NUMERIC(5,2) DEFAULT 0,     -- Based on correlations with other features

    -- Metrics used in calculation
    incoming_dependency_count INTEGER DEFAULT 0,
    outgoing_dependency_count INTEGER DEFAULT 0,
    total_connection_count INTEGER DEFAULT 0,
    blocking_count INTEGER DEFAULT 0,
    correlation_count INTEGER DEFAULT 0,

    -- Critical path analysis
    is_on_critical_path BOOLEAN DEFAULT false,
    critical_path_position INTEGER,  -- Position in critical path (1 = start)
    is_bottleneck BOOLEAN DEFAULT false,

    -- Ranking
    workspace_rank INTEGER,          -- Rank within workspace (1 = highest importance)
    percentile NUMERIC(5,2),        -- Percentile ranking (0-100)

    -- Weights used in calculation (for reproducibility)
    calculation_weights JSONB DEFAULT '{
        "dependency": 0.20,
        "blocking": 0.15,
        "connection": 0.15,
        "business_value": 0.20,
        "priority": 0.15,
        "workflow": 0.10,
        "complexity": 0.05
    }'::jsonb,

    -- Calculation metadata
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    calculation_version TEXT DEFAULT 'v1.0',
    calculation_method TEXT DEFAULT 'weighted_sum',

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure one score per feature
    UNIQUE(feature_id)
);

-- ========== INDEXES ==========

CREATE INDEX IF NOT EXISTS idx_importance_feature ON feature_importance_scores(feature_id);
CREATE INDEX IF NOT EXISTS idx_importance_workspace ON feature_importance_scores(workspace_id);
CREATE INDEX IF NOT EXISTS idx_importance_user ON feature_importance_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_importance_overall_score ON feature_importance_scores(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_importance_workspace_rank ON feature_importance_scores(workspace_id, workspace_rank);
CREATE INDEX IF NOT EXISTS idx_importance_critical_path ON feature_importance_scores(is_on_critical_path) WHERE is_on_critical_path = true;
CREATE INDEX IF NOT EXISTS idx_importance_bottleneck ON feature_importance_scores(is_bottleneck) WHERE is_bottleneck = true;

-- Composite index for top features query
CREATE INDEX IF NOT EXISTS idx_importance_workspace_score ON feature_importance_scores(workspace_id, overall_score DESC);

-- ========== HELPER FUNCTIONS ==========

-- Function to calculate importance score for a feature
CREATE OR REPLACE FUNCTION calculate_importance_score(feature_id_param TEXT)
RETURNS NUMERIC AS $$
DECLARE
    v_dependency_score NUMERIC := 0;
    v_blocking_score NUMERIC := 0;
    v_connection_score NUMERIC := 0;
    v_business_value_score NUMERIC := 0;
    v_priority_score NUMERIC := 0;
    v_workflow_score NUMERIC := 0;
    v_complexity_score NUMERIC := 0;
    v_overall_score NUMERIC := 0;

    v_incoming_deps INTEGER := 0;
    v_outgoing_deps INTEGER := 0;
    v_total_connections INTEGER := 0;
    v_blocking_count INTEGER := 0;

    v_business_value TEXT;
    v_priority TEXT;
    v_workflow_stage TEXT;
    v_difficulty TEXT;

    -- Weights
    w_dependency NUMERIC := 0.20;
    w_blocking NUMERIC := 0.15;
    w_connection NUMERIC := 0.15;
    w_business_value NUMERIC := 0.20;
    w_priority NUMERIC := 0.15;
    w_workflow NUMERIC := 0.10;
    w_complexity NUMERIC := 0.05;
BEGIN
    -- Get feature data
    SELECT
        business_value,
        priority,
        workflow_stage,
        COALESCE(
            (CASE
                WHEN EXISTS (
                    SELECT 1 FROM features f, jsonb_array_elements(f.timeline_items) AS item
                    WHERE f.id = feature_id_param AND item->>'difficulty' IS NOT NULL
                )
                THEN (
                    SELECT item->>'difficulty'
                    FROM features f, jsonb_array_elements(f.timeline_items) AS item
                    WHERE f.id = feature_id_param AND item->>'difficulty' IS NOT NULL
                    LIMIT 1
                )
                ELSE NULL
            END),
            'Medium'
        ) as difficulty
    INTO v_business_value, v_priority, v_workflow_stage, v_difficulty
    FROM features
    WHERE id = feature_id_param;

    -- Count connections
    SELECT
        COUNT(CASE WHEN target_feature_id = feature_id_param AND connection_type = 'dependency' THEN 1 END),
        COUNT(CASE WHEN source_feature_id = feature_id_param AND connection_type = 'dependency' THEN 1 END),
        COUNT(*),
        COUNT(CASE WHEN source_feature_id = feature_id_param AND connection_type = 'blocks' THEN 1 END)
    INTO v_incoming_deps, v_outgoing_deps, v_total_connections, v_blocking_count
    FROM feature_connections
    WHERE (source_feature_id = feature_id_param OR target_feature_id = feature_id_param)
        AND status = 'active';

    -- Calculate dependency score (0-100 based on incoming dependencies)
    v_dependency_score := LEAST(100, v_incoming_deps * 20);

    -- Calculate blocking score (0-100 based on features blocked)
    v_blocking_score := LEAST(100, v_blocking_count * 25);

    -- Calculate connection score (0-100 based on total connections)
    v_connection_score := LEAST(100, v_total_connections * 10);

    -- Calculate business value score (0-100)
    v_business_value_score := CASE v_business_value
        WHEN 'critical' THEN 100
        WHEN 'high' THEN 75
        WHEN 'medium' THEN 50
        WHEN 'low' THEN 25
        ELSE 50
    END;

    -- Calculate priority score (0-100)
    v_priority_score := CASE v_priority
        WHEN 'critical' THEN 100
        WHEN 'high' THEN 75
        WHEN 'medium' THEN 50
        WHEN 'low' THEN 25
        ELSE 50
    END;

    -- Calculate workflow score (0-100 based on stage)
    v_workflow_score := CASE v_workflow_stage
        WHEN 'completed' THEN 25
        WHEN 'execution' THEN 75
        WHEN 'planning' THEN 50
        WHEN 'ideation' THEN 100  -- Early stages are more important to prioritize
        ELSE 50
    END;

    -- Calculate complexity score (0-100, higher difficulty = lower score for now)
    v_complexity_score := CASE v_difficulty
        WHEN 'Easy' THEN 75
        WHEN 'Medium' THEN 50
        WHEN 'Hard' THEN 25
        ELSE 50
    END;

    -- Calculate weighted overall score
    v_overall_score :=
        (v_dependency_score * w_dependency) +
        (v_blocking_score * w_blocking) +
        (v_connection_score * w_connection) +
        (v_business_value_score * w_business_value) +
        (v_priority_score * w_priority) +
        (v_workflow_score * w_workflow) +
        (v_complexity_score * w_complexity);

    -- Update or insert score
    INSERT INTO feature_importance_scores (
        id, feature_id, workspace_id, user_id,
        overall_score,
        dependency_score, blocking_score, connection_score,
        business_value_score, priority_score, workflow_score, complexity_score,
        incoming_dependency_count, outgoing_dependency_count,
        total_connection_count, blocking_count,
        calculated_at
    )
    SELECT
        (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT::TEXT,
        feature_id_param,
        f.workspace_id,
        f.user_id,
        v_overall_score,
        v_dependency_score, v_blocking_score, v_connection_score,
        v_business_value_score, v_priority_score, v_workflow_score, v_complexity_score,
        v_incoming_deps, v_outgoing_deps,
        v_total_connections, v_blocking_count,
        NOW()
    FROM features f
    WHERE f.id = feature_id_param
    ON CONFLICT (feature_id) DO UPDATE SET
        overall_score = v_overall_score,
        dependency_score = v_dependency_score,
        blocking_score = v_blocking_score,
        connection_score = v_connection_score,
        business_value_score = v_business_value_score,
        priority_score = v_priority_score,
        workflow_score = v_workflow_score,
        complexity_score = v_complexity_score,
        incoming_dependency_count = v_incoming_deps,
        outgoing_dependency_count = v_outgoing_deps,
        total_connection_count = v_total_connections,
        blocking_count = v_blocking_count,
        calculated_at = NOW(),
        updated_at = NOW();

    RETURN v_overall_score;
END;
$$ LANGUAGE plpgsql;

-- Function to recalculate all importance scores for a workspace
CREATE OR REPLACE FUNCTION recalculate_workspace_importance(workspace_id_param TEXT)
RETURNS INTEGER AS $$
DECLARE
    feature_record RECORD;
    processed_count INTEGER := 0;
BEGIN
    -- Calculate scores for all features in workspace
    FOR feature_record IN
        SELECT id FROM features WHERE workspace_id = workspace_id_param
    LOOP
        PERFORM calculate_importance_score(feature_record.id);
        processed_count := processed_count + 1;
    END LOOP;

    -- Update rankings
    WITH ranked_features AS (
        SELECT
            feature_id,
            ROW_NUMBER() OVER (ORDER BY overall_score DESC) as rank,
            PERCENT_RANK() OVER (ORDER BY overall_score DESC) * 100 as pct
        FROM feature_importance_scores
        WHERE workspace_id = workspace_id_param
    )
    UPDATE feature_importance_scores fis
    SET
        workspace_rank = rf.rank,
        percentile = ROUND(rf.pct::numeric, 2),
        updated_at = NOW()
    FROM ranked_features rf
    WHERE fis.feature_id = rf.feature_id;

    RETURN processed_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get top N most important features in a workspace
CREATE OR REPLACE FUNCTION get_top_important_features(
    workspace_id_param TEXT,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    feature_id TEXT,
    overall_score NUMERIC,
    workspace_rank INTEGER,
    is_on_critical_path BOOLEAN,
    is_bottleneck BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        fis.feature_id,
        fis.overall_score,
        fis.workspace_rank,
        fis.is_on_critical_path,
        fis.is_bottleneck
    FROM feature_importance_scores fis
    WHERE fis.workspace_id = workspace_id_param
    ORDER BY fis.overall_score DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ========== TRIGGER FOR UPDATED_AT ==========

CREATE OR REPLACE FUNCTION update_importance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_importance_timestamp
    BEFORE UPDATE ON feature_importance_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_importance_updated_at();

-- ========== GRANT PERMISSIONS ==========

GRANT ALL ON TABLE feature_importance_scores TO anon, authenticated;
GRANT EXECUTE ON FUNCTION calculate_importance_score(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION recalculate_workspace_importance(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_top_important_features(TEXT, INTEGER) TO anon, authenticated;

-- ========== COMMENTS FOR DOCUMENTATION ==========

COMMENT ON TABLE feature_importance_scores IS 'Stores calculated importance scores for features based on multiple factors';
COMMENT ON COLUMN feature_importance_scores.overall_score IS 'Weighted overall importance score (0-100)';
COMMENT ON COLUMN feature_importance_scores.dependency_score IS 'Score based on incoming dependencies (0-100)';
COMMENT ON COLUMN feature_importance_scores.is_on_critical_path IS 'True if feature is on the critical path for project completion';
COMMENT ON COLUMN feature_importance_scores.is_bottleneck IS 'True if feature is identified as a bottleneck';
COMMENT ON COLUMN feature_importance_scores.workspace_rank IS 'Rank within workspace (1 = most important)';

-- ========== MIGRATION COMPLETE ==========

DO $$
BEGIN
    RAISE NOTICE 'Feature importance scores migration completed successfully';
    RAISE NOTICE 'Created table: feature_importance_scores';
    RAISE NOTICE 'Created 8 indexes for optimized queries';
    RAISE NOTICE 'Created 3 helper functions for score calculation';
    RAISE NOTICE 'Created 1 trigger for timestamp management';
END $$;
