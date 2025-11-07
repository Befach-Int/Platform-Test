-- Add execution_steps table for detailed feature implementation steps
-- This was previously only stored in localStorage

CREATE TABLE IF NOT EXISTS execution_steps (
    id TEXT PRIMARY KEY,
    feature_id TEXT NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL DEFAULT 'default',
    workspace_id TEXT,
    step_order INTEGER NOT NULL DEFAULT 0,
    title TEXT NOT NULL,
    description TEXT,
    estimated_hours NUMERIC(10,2),
    actual_hours NUMERIC(10,2),
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'blocked', 'completed')),
    assignee TEXT,
    start_date TIMESTAMPTZ,
    completed_date TIMESTAMPTZ,
    blocked_by TEXT,
    dependencies TEXT[] DEFAULT '{}',
    checklist_items JSONB DEFAULT '[]'::jsonb,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_execution_steps_feature_id ON execution_steps(feature_id);
CREATE INDEX IF NOT EXISTS idx_execution_steps_user_id ON execution_steps(user_id);
CREATE INDEX IF NOT EXISTS idx_execution_steps_workspace_id ON execution_steps(workspace_id);
CREATE INDEX IF NOT EXISTS idx_execution_steps_status ON execution_steps(status);
CREATE INDEX IF NOT EXISTS idx_execution_steps_assignee ON execution_steps(assignee);
CREATE INDEX IF NOT EXISTS idx_execution_steps_order ON execution_steps(feature_id, step_order);

-- Add trigger for updated_at
CREATE TRIGGER update_execution_steps_updated_at
    BEFORE UPDATE ON execution_steps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE execution_steps ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own execution steps"
    ON execution_steps FOR SELECT
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
           OR user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can insert their own execution steps"
    ON execution_steps FOR INSERT
    WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
                OR user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can update their own execution steps"
    ON execution_steps FOR UPDATE
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
           OR user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can delete their own execution steps"
    ON execution_steps FOR DELETE
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'
           OR user_id = current_setting('app.user_id', true));

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE execution_steps;

-- Grant permissions
GRANT ALL ON execution_steps TO authenticated, anon;
