-- Add feature planning tables: milestones, risks, and prerequisites
-- This was previously only stored in localStorage

-- ========== MILESTONES TABLE ==========
CREATE TABLE IF NOT EXISTS milestones (
    id TEXT PRIMARY KEY,
    feature_id TEXT NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL DEFAULT 'default',
    workspace_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    target_date DATE,
    actual_date DATE,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'at_risk', 'completed', 'missed')),
    owner TEXT,
    dependencies TEXT[] DEFAULT '{}',
    criteria TEXT[] DEFAULT '{}',
    progress_percent NUMERIC(5,2) DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    critical_path BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== RISKS TABLE ==========
CREATE TABLE IF NOT EXISTS risks (
    id TEXT PRIMARY KEY,
    feature_id TEXT NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL DEFAULT 'default',
    workspace_id TEXT,
    description TEXT NOT NULL,
    mitigation TEXT,
    severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    probability TEXT NOT NULL DEFAULT 'possible' CHECK (probability IN ('very_likely', 'likely', 'possible', 'unlikely')),
    risk_score NUMERIC(5,2),
    status TEXT NOT NULL DEFAULT 'identified' CHECK (status IN ('identified', 'analyzing', 'mitigating', 'monitoring', 'closed')),
    owner TEXT,
    category TEXT DEFAULT 'technical' CHECK (category IN ('technical', 'business', 'resource', 'schedule', 'external')),
    identified_date DATE DEFAULT CURRENT_DATE,
    review_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== PREREQUISITES TABLE ==========
CREATE TABLE IF NOT EXISTS prerequisites (
    id TEXT PRIMARY KEY,
    feature_id TEXT NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL DEFAULT 'default',
    workspace_id TEXT,
    prerequisite_text TEXT NOT NULL,
    category TEXT DEFAULT 'technical' CHECK (category IN ('technical', 'knowledge', 'infrastructure', 'dependency', 'other')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
    completion_date DATE,
    notes TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== CREATE INDEXES ==========

-- Milestones indexes
CREATE INDEX IF NOT EXISTS idx_milestones_feature_id ON milestones(feature_id);
CREATE INDEX IF NOT EXISTS idx_milestones_user_id ON milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_workspace_id ON milestones(workspace_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON milestones(status);
CREATE INDEX IF NOT EXISTS idx_milestones_target_date ON milestones(target_date);
CREATE INDEX IF NOT EXISTS idx_milestones_owner ON milestones(owner);

-- Risks indexes
CREATE INDEX IF NOT EXISTS idx_risks_feature_id ON risks(feature_id);
CREATE INDEX IF NOT EXISTS idx_risks_user_id ON risks(user_id);
CREATE INDEX IF NOT EXISTS idx_risks_workspace_id ON risks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_risks_severity ON risks(severity);
CREATE INDEX IF NOT EXISTS idx_risks_status ON risks(status);
CREATE INDEX IF NOT EXISTS idx_risks_category ON risks(category);

-- Prerequisites indexes
CREATE INDEX IF NOT EXISTS idx_prerequisites_feature_id ON prerequisites(feature_id);
CREATE INDEX IF NOT EXISTS idx_prerequisites_user_id ON prerequisites(user_id);
CREATE INDEX IF NOT EXISTS idx_prerequisites_workspace_id ON prerequisites(workspace_id);
CREATE INDEX IF NOT EXISTS idx_prerequisites_status ON prerequisites(status);
CREATE INDEX IF NOT EXISTS idx_prerequisites_order ON prerequisites(feature_id, display_order);

-- ========== ADD TRIGGERS FOR UPDATED_AT ==========
CREATE TRIGGER update_milestones_updated_at
    BEFORE UPDATE ON milestones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_risks_updated_at
    BEFORE UPDATE ON risks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prerequisites_updated_at
    BEFORE UPDATE ON prerequisites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========== ENABLE ROW LEVEL SECURITY ==========
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE prerequisites ENABLE ROW LEVEL SECURITY;

-- ========== RLS POLICIES FOR MILESTONES ==========
CREATE POLICY "Users can view their own milestones"
    ON milestones FOR SELECT
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
           OR user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can insert their own milestones"
    ON milestones FOR INSERT
    WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
                OR user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can update their own milestones"
    ON milestones FOR UPDATE
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
           OR user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can delete their own milestones"
    ON milestones FOR DELETE
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
           OR user_id = current_setting('app.user_id', true));

-- ========== RLS POLICIES FOR RISKS ==========
CREATE POLICY "Users can view their own risks"
    ON risks FOR SELECT
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
           OR user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can insert their own risks"
    ON risks FOR INSERT
    WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
                OR user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can update their own risks"
    ON risks FOR UPDATE
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
           OR user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can delete their own risks"
    ON risks FOR DELETE
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
           OR user_id = current_setting('app.user_id', true));

-- ========== RLS POLICIES FOR PREREQUISITES ==========
CREATE POLICY "Users can view their own prerequisites"
    ON prerequisites FOR SELECT
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
           OR user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can insert their own prerequisites"
    ON prerequisites FOR INSERT
    WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
                OR user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can update their own prerequisites"
    ON prerequisites FOR UPDATE
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
           OR user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can delete their own prerequisites"
    ON prerequisites FOR DELETE
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
           OR user_id = current_setting('app.user_id', true));

-- ========== ENABLE REAL-TIME ==========
ALTER PUBLICATION supabase_realtime ADD TABLE milestones;
ALTER PUBLICATION supabase_realtime ADD TABLE risks;
ALTER PUBLICATION supabase_realtime ADD TABLE prerequisites;

-- ========== GRANT PERMISSIONS ==========
GRANT ALL ON milestones TO authenticated, anon;
GRANT ALL ON risks TO authenticated, anon;
GRANT ALL ON prerequisites TO authenticated, anon;
