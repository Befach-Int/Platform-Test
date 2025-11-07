-- Add Feature Correlation Detection System
-- Enables automatic detection of relationships based on similarity analysis
-- Migration: 20250113000003_add_feature_correlations_table.sql

-- ========== FEATURE CORRELATIONS TABLE ==========

CREATE TABLE IF NOT EXISTS feature_correlations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'default',
    workspace_id TEXT NOT NULL,

    -- Correlated features
    feature_a_id TEXT NOT NULL,
    feature_b_id TEXT NOT NULL,

    -- Correlation metrics
    correlation_score NUMERIC(5,4) DEFAULT 0 CHECK (correlation_score >= 0 AND correlation_score <= 1),
    cosine_similarity NUMERIC(5,4),      -- Text similarity (0-1)
    keyword_overlap_score NUMERIC(5,4),  -- Keyword overlap (0-1)
    category_similarity NUMERIC(5,4),    -- Category similarity (0-1)
    structural_similarity NUMERIC(5,4),  -- Structure similarity (0-1)

    -- Correlation type (inferred from analysis)
    correlation_type TEXT CHECK (correlation_type IN (
        'high_similarity',      -- Very similar features (potential duplicates)
        'complementary',        -- Features that work well together
        'sequential',           -- Features that follow each other
        'thematic',            -- Share same theme/domain
        'technical',           -- Share technical requirements
        'functional'           -- Share functional area
    )),

    -- Evidence and reasoning
    common_keywords TEXT[] DEFAULT '{}',
    common_categories TEXT[] DEFAULT '{}',
    similarity_factors JSONB DEFAULT '[]'::jsonb,  -- Array of factors contributing to correlation

    -- Analysis metadata
    detection_method TEXT DEFAULT 'tfidf_cosine',
    detection_algorithm_version TEXT DEFAULT 'v1.0',
    detected_at TIMESTAMPTZ DEFAULT NOW(),

    -- Quality metrics
    confidence NUMERIC(3,2) DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
    relevance NUMERIC(3,2) DEFAULT 0.5 CHECK (relevance >= 0 AND relevance <= 1),

    -- User interaction
    user_reviewed BOOLEAN DEFAULT false,
    user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),  -- User can rate correlation quality
    user_notes TEXT,
    reviewed_at TIMESTAMPTZ,

    -- Status
    status TEXT DEFAULT 'detected' CHECK (status IN (
        'detected',         -- Newly detected
        'reviewed',        -- User has reviewed
        'accepted',        -- User accepted as valid
        'rejected',        -- User rejected as invalid
        'converted'        -- Converted to explicit connection
    )),

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure no duplicate correlations (order-independent)
    CONSTRAINT unique_correlation CHECK (feature_a_id < feature_b_id)
);

-- ========== INDEXES ==========

CREATE INDEX IF NOT EXISTS idx_correlations_feature_a ON feature_correlations(feature_a_id);
CREATE INDEX IF NOT EXISTS idx_correlations_feature_b ON feature_correlations(feature_b_id);
CREATE INDEX IF NOT EXISTS idx_correlations_workspace ON feature_correlations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_correlations_score ON feature_correlations(correlation_score DESC);
CREATE INDEX IF NOT EXISTS idx_correlations_type ON feature_correlations(correlation_type);
CREATE INDEX IF NOT EXISTS idx_correlations_status ON feature_correlations(status);

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_correlations_workspace_score ON feature_correlations(workspace_id, correlation_score DESC);
CREATE INDEX IF NOT EXISTS idx_correlations_features_pair ON feature_correlations(feature_a_id, feature_b_id);

-- Array indexes
CREATE INDEX IF NOT EXISTS idx_correlations_keywords ON feature_correlations USING GIN(common_keywords);
CREATE INDEX IF NOT EXISTS idx_correlations_categories ON feature_correlations USING GIN(common_categories);

-- JSONB index
CREATE INDEX IF NOT EXISTS idx_correlations_factors ON feature_correlations USING GIN(similarity_factors);

-- Unique index for preventing duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_correlations_unique_pair ON feature_correlations(
    LEAST(feature_a_id, feature_b_id),
    GREATEST(feature_a_id, feature_b_id)
);

-- ========== HELPER FUNCTIONS ==========

-- Function to get correlations for a feature
CREATE OR REPLACE FUNCTION get_feature_correlations(
    feature_id_param TEXT,
    min_score NUMERIC DEFAULT 0.3
)
RETURNS TABLE (
    correlation_id TEXT,
    correlated_feature_id TEXT,
    correlation_score NUMERIC,
    correlation_type TEXT,
    common_keywords TEXT[],
    confidence NUMERIC,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        fc.id as correlation_id,
        CASE
            WHEN fc.feature_a_id = feature_id_param THEN fc.feature_b_id
            ELSE fc.feature_a_id
        END as correlated_feature_id,
        fc.correlation_score,
        fc.correlation_type,
        fc.common_keywords,
        fc.confidence,
        fc.status
    FROM feature_correlations fc
    WHERE (fc.feature_a_id = feature_id_param OR fc.feature_b_id = feature_id_param)
        AND fc.correlation_score >= min_score
        AND fc.status IN ('detected', 'reviewed', 'accepted')
    ORDER BY fc.correlation_score DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate text similarity using word overlap (simplified TF-IDF approximation)
CREATE OR REPLACE FUNCTION calculate_text_similarity(text1 TEXT, text2 TEXT)
RETURNS NUMERIC AS $$
DECLARE
    words1 TEXT[];
    words2 TEXT[];
    common_count INTEGER;
    total_count INTEGER;
    similarity_score NUMERIC;
BEGIN
    -- Convert to lowercase and split into words
    words1 := regexp_split_to_array(lower(text1), '\s+');
    words2 := regexp_split_to_array(lower(text2), '\s+');

    -- Count common words
    SELECT COUNT(DISTINCT word) INTO common_count
    FROM unnest(words1) AS word
    WHERE word = ANY(words2);

    -- Calculate total unique words
    SELECT COUNT(DISTINCT word) INTO total_count
    FROM (
        SELECT unnest(words1) AS word
        UNION
        SELECT unnest(words2) AS word
    ) AS all_words;

    -- Calculate Jaccard similarity
    IF total_count > 0 THEN
        similarity_score := common_count::NUMERIC / total_count::NUMERIC;
    ELSE
        similarity_score := 0;
    END IF;

    RETURN ROUND(similarity_score, 4);
END;
$$ LANGUAGE plpgsql;

-- Function to find potential correlations for a feature
CREATE OR REPLACE FUNCTION find_feature_correlations(
    feature_id_param TEXT,
    min_threshold NUMERIC DEFAULT 0.3
)
RETURNS TABLE (
    correlated_feature_id TEXT,
    correlation_score NUMERIC,
    cosine_sim NUMERIC,
    keyword_overlap NUMERIC,
    common_keywords TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    WITH target_feature AS (
        SELECT
            id,
            name,
            purpose,
            workspace_id,
            COALESCE(
                (SELECT array_agg(DISTINCT cat)
                 FROM features f,
                      jsonb_array_elements(f.timeline_items) AS item,
                      jsonb_array_elements_text(item->'category') AS cat
                 WHERE f.id = feature_id_param),
                '{}'::TEXT[]
            ) as categories
        FROM features
        WHERE id = feature_id_param
    ),
    candidate_features AS (
        SELECT
            f.id,
            f.name,
            f.purpose,
            COALESCE(
                (SELECT array_agg(DISTINCT cat)
                 FROM jsonb_array_elements(f.timeline_items) AS item,
                      jsonb_array_elements_text(item->'category') AS cat),
                '{}'::TEXT[]
            ) as categories
        FROM features f
        WHERE f.workspace_id = (SELECT workspace_id FROM target_feature)
            AND f.id != feature_id_param
    )
    SELECT
        cf.id as correlated_feature_id,
        ROUND(
            (COALESCE(calculate_text_similarity(tf.name || ' ' || COALESCE(tf.purpose, ''),
                                                cf.name || ' ' || COALESCE(cf.purpose, '')), 0) * 0.6 +
             COALESCE((SELECT COUNT(*) FROM unnest(tf.categories) AS cat
                      WHERE cat = ANY(cf.categories))::NUMERIC /
                     NULLIF(GREATEST(array_length(tf.categories, 1), array_length(cf.categories, 1)), 0), 0) * 0.4)::NUMERIC,
            4
        ) as correlation_score,
        calculate_text_similarity(tf.name || ' ' || COALESCE(tf.purpose, ''),
                                 cf.name || ' ' || COALESCE(cf.purpose, '')) as cosine_sim,
        COALESCE((SELECT COUNT(*) FROM unnest(tf.categories) AS cat
                 WHERE cat = ANY(cf.categories))::NUMERIC /
                NULLIF(GREATEST(array_length(tf.categories, 1), array_length(cf.categories, 1)), 0), 0) as keyword_overlap,
        (SELECT array_agg(DISTINCT cat)
         FROM unnest(tf.categories) AS cat
         WHERE cat = ANY(cf.categories)) as common_keywords
    FROM target_feature tf
    CROSS JOIN candidate_features cf
    WHERE calculate_text_similarity(tf.name || ' ' || COALESCE(tf.purpose, ''),
                                   cf.name || ' ' || COALESCE(cf.purpose, '')) >= min_threshold
    ORDER BY correlation_score DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to detect and store correlations for a workspace
CREATE OR REPLACE FUNCTION detect_workspace_correlations(
    workspace_id_param TEXT,
    min_threshold NUMERIC DEFAULT 0.3
)
RETURNS INTEGER AS $$
DECLARE
    feature_record RECORD;
    correlation_record RECORD;
    detected_count INTEGER := 0;
    correlation_id TEXT;
BEGIN
    -- For each feature in workspace
    FOR feature_record IN
        SELECT id FROM features WHERE workspace_id = workspace_id_param
    LOOP
        -- Find correlations
        FOR correlation_record IN
            SELECT * FROM find_feature_correlations(feature_record.id, min_threshold)
        LOOP
            -- Insert correlation (only if not already exists)
            correlation_id := (EXTRACT(EPOCH FROM NOW()) * 1000 + detected_count)::BIGINT::TEXT;

            INSERT INTO feature_correlations (
                id, workspace_id, user_id,
                feature_a_id, feature_b_id,
                correlation_score, cosine_similarity, keyword_overlap_score,
                common_keywords, confidence, status
            )
            SELECT
                correlation_id,
                workspace_id_param,
                'default',
                LEAST(feature_record.id, correlation_record.correlated_feature_id),
                GREATEST(feature_record.id, correlation_record.correlated_feature_id),
                correlation_record.correlation_score,
                correlation_record.cosine_sim,
                correlation_record.keyword_overlap,
                correlation_record.common_keywords,
                correlation_record.correlation_score,  -- Use score as confidence
                'detected'
            WHERE NOT EXISTS (
                SELECT 1 FROM feature_correlations
                WHERE (feature_a_id = LEAST(feature_record.id, correlation_record.correlated_feature_id)
                   AND feature_b_id = GREATEST(feature_record.id, correlation_record.correlated_feature_id))
                   OR (feature_b_id = LEAST(feature_record.id, correlation_record.correlated_feature_id)
                   AND feature_a_id = GREATEST(feature_record.id, correlation_record.correlated_feature_id))
            );

            detected_count := detected_count + 1;
        END LOOP;
    END LOOP;

    RETURN detected_count;
END;
$$ LANGUAGE plpgsql;

-- ========== TRIGGER FOR UPDATED_AT ==========

CREATE OR REPLACE FUNCTION update_correlation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_correlation_timestamp
    BEFORE UPDATE ON feature_correlations
    FOR EACH ROW
    EXECUTE FUNCTION update_correlation_updated_at();

-- ========== GRANT PERMISSIONS ==========

GRANT ALL ON TABLE feature_correlations TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_feature_correlations(TEXT, NUMERIC) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION calculate_text_similarity(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION find_feature_correlations(TEXT, NUMERIC) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION detect_workspace_correlations(TEXT, NUMERIC) TO anon, authenticated;

-- ========== COMMENTS FOR DOCUMENTATION ==========

COMMENT ON TABLE feature_correlations IS 'Stores automatically detected correlations between features based on similarity analysis';
COMMENT ON COLUMN feature_correlations.correlation_score IS 'Overall correlation score combining multiple similarity metrics (0-1)';
COMMENT ON COLUMN feature_correlations.cosine_similarity IS 'Text similarity using TF-IDF cosine similarity (0-1)';
COMMENT ON COLUMN feature_correlations.correlation_type IS 'Inferred type: high_similarity, complementary, sequential, thematic, technical, functional';
COMMENT ON COLUMN feature_correlations.confidence IS 'Confidence in correlation validity (0-1)';

-- ========== MIGRATION COMPLETE ==========

DO $$
BEGIN
    RAISE NOTICE 'Feature correlations migration completed successfully';
    RAISE NOTICE 'Created table: feature_correlations';
    RAISE NOTICE 'Created 12 indexes including GIN indexes for arrays and JSONB';
    RAISE NOTICE 'Created 4 helper functions for correlation detection';
    RAISE NOTICE 'Created 1 trigger for timestamp management';
END $$;
