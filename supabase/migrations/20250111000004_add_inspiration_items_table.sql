-- Add inspiration_items table for feature inspiration and references
-- This was previously only stored in localStorage

CREATE TABLE IF NOT EXISTS inspiration_items (
    id TEXT PRIMARY KEY,
    feature_id TEXT NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL DEFAULT 'default',
    workspace_id TEXT,
    title TEXT NOT NULL,
    url TEXT,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'reference' CHECK (type IN ('reference', 'competitor', 'example', 'tutorial', 'documentation', 'video', 'other')),
    image_url TEXT,
    relevance_score NUMERIC(3,1) CHECK (relevance_score >= 0 AND relevance_score <= 10),
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_inspiration_items_feature_id ON inspiration_items(feature_id);
CREATE INDEX IF NOT EXISTS idx_inspiration_items_user_id ON inspiration_items(user_id);
CREATE INDEX IF NOT EXISTS idx_inspiration_items_workspace_id ON inspiration_items(workspace_id);
CREATE INDEX IF NOT EXISTS idx_inspiration_items_type ON inspiration_items(type);
CREATE INDEX IF NOT EXISTS idx_inspiration_items_order ON inspiration_items(feature_id, display_order);

-- Add trigger for updated_at
CREATE TRIGGER update_inspiration_items_updated_at
    BEFORE UPDATE ON inspiration_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE inspiration_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own inspiration items"
    ON inspiration_items FOR SELECT
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
           OR user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can insert their own inspiration items"
    ON inspiration_items FOR INSERT
    WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
                OR user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can update their own inspiration items"
    ON inspiration_items FOR UPDATE
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
           OR user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can delete their own inspiration items"
    ON inspiration_items FOR DELETE
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
           OR user_id = current_setting('app.user_id', true));

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE inspiration_items;

-- Grant permissions
GRANT ALL ON inspiration_items TO authenticated, anon;
