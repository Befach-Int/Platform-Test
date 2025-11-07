-- Add Connection Insights and Analysis Results System
-- Stores analysis results, recommendations, and actionable insights
-- Migration: 20250113000004_add_connection_insights_table.sql

-- ========== CONNECTION INSIGHTS TABLE ==========

CREATE TABLE IF NOT EXISTS connection_insights (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'default',
    workspace_id TEXT NOT NULL,

    -- Insight type
    insight_type TEXT NOT NULL CHECK (insight_type IN (
        'critical_path',           -- Critical path analysis result
        'bottleneck_detected',     -- Bottleneck identification
        'missing_dependency',      -- Suggested missing dependency
        'circular_dependency',     -- Circular dependency warning
        'high_correlation',        -- High correlation suggestion
        'duplicate_feature',       -- Potential duplicate detected
        'orphaned_feature',        -- Feature with no connections
        'blocking_chain',          -- Chain of blocking features
        'optimization_opportunity', -- Performance/priority optimization
        'risk_indicator'           -- Risk or warning
    )),

    -- Severity/Priority
    severity TEXT DEFAULT 'info' CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
    priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),

    -- Affected features
    primary_feature_id TEXT,
    related_feature_ids TEXT[] DEFAULT '{}',
    affected_feature_count INTEGER DEFAULT 0,

    -- Insight details
    title TEXT NOT NULL,
    description TEXT,
    recommendation TEXT,
    impact_assessment TEXT,

    -- Metrics
    confidence_score NUMERIC(3,2) DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    impact_score NUMERIC(3,2) DEFAULT 0.5 CHECK (impact_score >= 0 AND impact_score <= 1),

    -- Analysis data
    analysis_data JSONB DEFAULT '{}'::jsonb,  -- Additional structured data
    evidence JSONB DEFAULT '[]'::jsonb,        -- Evidence supporting this insight

    -- Detection metadata
    detected_by TEXT DEFAULT 'system',  -- system, ai, user
    detection_method TEXT,
    detected_at TIMESTAMPTZ DEFAULT NOW(),

    -- User interaction
    status TEXT DEFAULT 'active' CHECK (status IN (
        'active',          -- Currently relevant
        'acknowledged',    -- User has seen it
        'resolved',        -- Issue resolved
        'dismissed',       -- User dismissed
        'obsolete'         -- No longer relevant
    )),

    user_acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMPTZ,
    user_notes TEXT,

    -- Action taken
    action_taken TEXT,
    action_taken_at TIMESTAMPTZ,

    -- Expiration (for time-sensitive insights)
    expires_at TIMESTAMPTZ,
    is_expired BOOLEAN DEFAULT false,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== INDEXES ==========

CREATE INDEX IF NOT EXISTS idx_insights_workspace ON connection_insights(workspace_id);
CREATE INDEX IF NOT EXISTS idx_insights_user ON connection_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_type ON connection_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_insights_severity ON connection_insights(severity);
CREATE INDEX IF NOT EXISTS idx_insights_status ON connection_insights(status);
CREATE INDEX IF NOT EXISTS idx_insights_primary_feature ON connection_insights(primary_feature_id);
CREATE INDEX IF NOT EXISTS idx_insights_priority ON connection_insights(priority DESC);

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_insights_workspace_status ON connection_insights(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_insights_workspace_type ON connection_insights(workspace_id, insight_type);
CREATE INDEX IF NOT EXISTS idx_insights_severity_priority ON connection_insights(severity, priority DESC);

-- Array index for related features
CREATE INDEX IF NOT EXISTS idx_insights_related_features ON connection_insights USING GIN(related_feature_ids);

-- JSONB indexes
CREATE INDEX IF NOT EXISTS idx_insights_analysis_data ON connection_insights USING GIN(analysis_data);
CREATE INDEX IF NOT EXISTS idx_insights_evidence ON connection_insights USING GIN(evidence);

-- Active insights (most common query)
CREATE INDEX IF NOT EXISTS idx_insights_active ON connection_insights(workspace_id, severity, priority DESC)
    WHERE status = 'active';

-- ========== HELPER FUNCTIONS ==========

-- Function to get active insights for a workspace
CREATE OR REPLACE FUNCTION get_workspace_insights(
    workspace_id_param TEXT,
    min_severity TEXT DEFAULT 'low',
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
    insight_id TEXT,
    insight_type TEXT,
    severity TEXT,
    priority INTEGER,
    title TEXT,
    description TEXT,
    recommendation TEXT,
    primary_feature_id TEXT,
    related_feature_ids TEXT[],
    confidence_score NUMERIC,
    detected_at TIMESTAMPTZ
) AS $$
DECLARE
    severity_rank INTEGER;
BEGIN
    -- Map severity to rank for comparison
    severity_rank := CASE min_severity
        WHEN 'critical' THEN 5
        WHEN 'high' THEN 4
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 2
        ELSE 1
    END;

    RETURN QUERY
    SELECT
        ci.id as insight_id,
        ci.insight_type,
        ci.severity,
        ci.priority,
        ci.title,
        ci.description,
        ci.recommendation,
        ci.primary_feature_id,
        ci.related_feature_ids,
        ci.confidence_score,
        ci.detected_at
    FROM connection_insights ci
    WHERE ci.workspace_id = workspace_id_param
        AND ci.status = 'active'
        AND (ci.expires_at IS NULL OR ci.expires_at > NOW())
        AND CASE ci.severity
            WHEN 'critical' THEN 5
            WHEN 'high' THEN 4
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 2
            ELSE 1
        END >= severity_rank
    ORDER BY
        CASE ci.severity
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
            ELSE 5
        END,
        ci.priority DESC,
        ci.detected_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to create an insight
CREATE OR REPLACE FUNCTION create_insight(
    p_workspace_id TEXT,
    p_insight_type TEXT,
    p_title TEXT,
    p_description TEXT,
    p_severity TEXT DEFAULT 'info',
    p_primary_feature_id TEXT DEFAULT NULL,
    p_related_feature_ids TEXT[] DEFAULT '{}',
    p_recommendation TEXT DEFAULT NULL,
    p_confidence_score NUMERIC DEFAULT 0.7,
    p_detection_method TEXT DEFAULT 'system_analysis'
)
RETURNS TEXT AS $$
DECLARE
    new_insight_id TEXT;
BEGIN
    new_insight_id := (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT::TEXT;

    INSERT INTO connection_insights (
        id, workspace_id, user_id,
        insight_type, severity, title, description, recommendation,
        primary_feature_id, related_feature_ids,
        affected_feature_count, confidence_score,
        detection_method, detected_at, status
    ) VALUES (
        new_insight_id,
        p_workspace_id,
        'default',
        p_insight_type,
        p_severity,
        p_title,
        p_description,
        p_recommendation,
        p_primary_feature_id,
        p_related_feature_ids,
        COALESCE(array_length(p_related_feature_ids, 1), 0) + CASE WHEN p_primary_feature_id IS NOT NULL THEN 1 ELSE 0 END,
        p_confidence_score,
        p_detection_method,
        NOW(),
        'active'
    );

    RETURN new_insight_id;
END;
$$ LANGUAGE plpgsql;

-- Function to detect critical path and create insights
CREATE OR REPLACE FUNCTION analyze_critical_path(workspace_id_param TEXT)
RETURNS INTEGER AS $$
DECLARE
    insight_count INTEGER := 0;
    feature_on_path RECORD;
BEGIN
    -- Find features on critical path (those with high dependency scores)
    FOR feature_on_path IN
        SELECT
            fis.feature_id,
            f.name,
            fis.incoming_dependency_count,
            fis.blocking_count
        FROM feature_importance_scores fis
        JOIN features f ON f.id = fis.feature_id
        WHERE fis.workspace_id = workspace_id_param
            AND fis.is_on_critical_path = true
        ORDER BY fis.workspace_rank
    LOOP
        -- Create insight for critical path feature
        PERFORM create_insight(
            workspace_id_param,
            'critical_path',
            format('Critical Path: %s', feature_on_path.name),
            format('This feature is on the critical path with %s dependencies and blocks %s other features.',
                   feature_on_path.incoming_dependency_count,
                   feature_on_path.blocking_count),
            'high',
            feature_on_path.feature_id,
            '{}',
            'Prioritize this feature to avoid project delays',
            0.9,
            'critical_path_analysis'
        );

        insight_count := insight_count + 1;
    END LOOP;

    RETURN insight_count;
END;
$$ LANGUAGE plpgsql;

-- Function to detect bottlenecks and create insights
CREATE OR REPLACE FUNCTION detect_bottlenecks(workspace_id_param TEXT)
RETURNS INTEGER AS $$
DECLARE
    insight_count INTEGER := 0;
    bottleneck_record RECORD;
BEGIN
    -- Find bottleneck features (high blocking_count)
    FOR bottleneck_record IN
        SELECT
            fis.feature_id,
            f.name,
            fis.blocking_count,
            array_agg(fc.target_feature_id) as blocked_features
        FROM feature_importance_scores fis
        JOIN features f ON f.id = fis.feature_id
        LEFT JOIN feature_connections fc ON fc.source_feature_id = fis.feature_id
            AND fc.connection_type = 'blocks'
            AND fc.status = 'active'
        WHERE fis.workspace_id = workspace_id_param
            AND fis.is_bottleneck = true
        GROUP BY fis.feature_id, f.name, fis.blocking_count
    LOOP
        PERFORM create_insight(
            workspace_id_param,
            'bottleneck_detected',
            format('Bottleneck: %s', bottleneck_record.name),
            format('This feature blocks %s other features from progressing.', bottleneck_record.blocking_count),
            'critical',
            bottleneck_record.feature_id,
            bottleneck_record.blocked_features,
            'Complete this feature urgently to unblock dependent work',
            0.85,
            'bottleneck_detection'
        );

        insight_count := insight_count + 1;
    END LOOP;

    RETURN insight_count;
END;
$$ LANGUAGE plpgsql;

-- Function to detect orphaned features
CREATE OR REPLACE FUNCTION detect_orphaned_features(workspace_id_param TEXT)
RETURNS INTEGER AS $$
DECLARE
    insight_count INTEGER := 0;
    orphan_record RECORD;
BEGIN
    -- Find features with no connections
    FOR orphan_record IN
        SELECT f.id, f.name
        FROM features f
        WHERE f.workspace_id = workspace_id_param
            AND NOT EXISTS (
                SELECT 1 FROM feature_connections fc
                WHERE (fc.source_feature_id = f.id OR fc.target_feature_id = f.id)
                    AND fc.status = 'active'
            )
    LOOP
        PERFORM create_insight(
            workspace_id_param,
            'orphaned_feature',
            format('Isolated: %s', orphan_record.name),
            'This feature has no connections to other features.',
            'low',
            orphan_record.id,
            '{}',
            'Consider connecting this feature or reviewing its relevance',
            0.95,
            'orphan_detection'
        );

        insight_count := insight_count + 1;
    END LOOP;

    RETURN insight_count;
END;
$$ LANGUAGE plpgsql;

-- Function to run all analyses for a workspace
CREATE OR REPLACE FUNCTION analyze_workspace(workspace_id_param TEXT)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    critical_path_count INTEGER;
    bottleneck_count INTEGER;
    orphan_count INTEGER;
BEGIN
    -- Clear old insights
    UPDATE connection_insights
    SET status = 'obsolete'
    WHERE workspace_id = workspace_id_param
        AND status = 'active'
        AND detected_by = 'system';

    -- Run analyses
    critical_path_count := analyze_critical_path(workspace_id_param);
    bottleneck_count := detect_bottlenecks(workspace_id_param);
    orphan_count := detect_orphaned_features(workspace_id_param);

    -- Build result
    result := jsonb_build_object(
        'workspace_id', workspace_id_param,
        'analyzed_at', NOW(),
        'insights_created', critical_path_count + bottleneck_count + orphan_count,
        'breakdown', jsonb_build_object(
            'critical_path', critical_path_count,
            'bottlenecks', bottleneck_count,
            'orphaned', orphan_count
        )
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ========== TRIGGER FOR UPDATED_AT ==========

CREATE OR REPLACE FUNCTION update_insight_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_insight_timestamp
    BEFORE UPDATE ON connection_insights
    FOR EACH ROW
    EXECUTE FUNCTION update_insight_updated_at();

-- ========== GRANT PERMISSIONS ==========

GRANT ALL ON TABLE connection_insights TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_workspace_insights(TEXT, TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_insight(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT, NUMERIC, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION analyze_critical_path(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION detect_bottlenecks(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION detect_orphaned_features(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION analyze_workspace(TEXT) TO anon, authenticated;

-- ========== COMMENTS FOR DOCUMENTATION ==========

COMMENT ON TABLE connection_insights IS 'Stores analysis results, recommendations, and actionable insights about feature connections';
COMMENT ON COLUMN connection_insights.insight_type IS 'Type: critical_path, bottleneck_detected, missing_dependency, circular_dependency, high_correlation, etc.';
COMMENT ON COLUMN connection_insights.severity IS 'Severity level: critical, high, medium, low, info';
COMMENT ON COLUMN connection_insights.confidence_score IS 'Confidence in insight accuracy (0-1)';
COMMENT ON COLUMN connection_insights.impact_score IS 'Estimated impact if insight is acted upon (0-1)';

-- ========== MIGRATION COMPLETE ==========

DO $$
BEGIN
    RAISE NOTICE 'Connection insights migration completed successfully';
    RAISE NOTICE 'Created table: connection_insights';
    RAISE NOTICE 'Created 13 indexes including GIN indexes for arrays and JSONB';
    RAISE NOTICE 'Created 7 helper functions for insight generation and analysis';
    RAISE NOTICE 'Created 1 trigger for timestamp management';
END $$;
