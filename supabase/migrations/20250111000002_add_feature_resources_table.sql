-- Add feature_resources table for resource planning and tracking
-- This was previously only stored in localStorage

CREATE TABLE IF NOT EXISTS feature_resources (
    id TEXT PRIMARY KEY,
    feature_id TEXT NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL DEFAULT 'default',
    workspace_id TEXT,

    -- Team roles array: [{role: "Backend Dev", count: 2, skillLevel: "Senior"}]
    team_roles JSONB DEFAULT '[]'::jsonb,

    -- Technologies array: ["React", "Node.js", "PostgreSQL"]
    technologies TEXT[] DEFAULT '{}',

    -- Budget tracking
    estimated_budget TEXT,
    actual_budget NUMERIC(15,2),
    currency TEXT DEFAULT 'USD',

    -- Hours tracking
    estimated_hours NUMERIC(10,2),
    actual_hours NUMERIC(10,2),

    -- External dependencies
    external_dependencies TEXT[] DEFAULT '{}',
    api_requirements TEXT[] DEFAULT '{}',
    infrastructure_needs TEXT[] DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure one resource record per feature
    UNIQUE(feature_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_feature_resources_feature_id ON feature_resources(feature_id);
CREATE INDEX IF NOT EXISTS idx_feature_resources_user_id ON feature_resources(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_resources_workspace_id ON feature_resources(workspace_id);

-- Add trigger for updated_at
CREATE TRIGGER update_feature_resources_updated_at
    BEFORE UPDATE ON feature_resources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE feature_resources ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own feature resources"
    ON feature_resources FOR SELECT
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
           OR user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can insert their own feature resources"
    ON feature_resources FOR INSERT
    WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
                OR user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can update their own feature resources"
    ON feature_resources FOR UPDATE
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
           OR user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can delete their own feature resources"
    ON feature_resources FOR DELETE
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
           OR user_id = current_setting('app.user_id', true));

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE feature_resources;

-- Grant permissions
GRANT ALL ON feature_resources TO authenticated, anon;
