-- Add unified canvas support to work_items and create work_flows table

-- 1. Create work_flows table for hierarchical sub-canvases (Phase 6 - postponed)
CREATE TABLE IF NOT EXISTS work_flows (
  id TEXT PRIMARY KEY DEFAULT (extract(epoch from now()) * 1000)::bigint::text,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  parent_flow_id TEXT REFERENCES work_flows(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  is_collapsed BOOLEAN DEFAULT true,
  canvas_position JSONB, -- Position of FlowNode on parent canvas
  viewport JSONB, -- Zoom/pan state when viewing this flow
  depth INTEGER DEFAULT 0,
  child_count INTEGER DEFAULT 0,
  work_item_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add canvas-related columns to work_items
ALTER TABLE work_items
  ADD COLUMN IF NOT EXISTS flow_id TEXT REFERENCES work_flows(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS canvas_position JSONB,
  ADD COLUMN IF NOT EXISTS is_note BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS note_type TEXT,
  ADD COLUMN IF NOT EXISTS note_content TEXT,
  ADD COLUMN IF NOT EXISTS is_placeholder BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS parent_work_item_id TEXT REFERENCES work_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS canvas_metadata JSONB;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_work_flows_workspace ON work_flows(workspace_id);
CREATE INDEX IF NOT EXISTS idx_work_flows_team ON work_flows(team_id);
CREATE INDEX IF NOT EXISTS idx_work_flows_parent ON work_flows(parent_flow_id);
CREATE INDEX IF NOT EXISTS idx_work_items_flow ON work_items(flow_id);
CREATE INDEX IF NOT EXISTS idx_work_items_parent ON work_items(parent_work_item_id);
CREATE INDEX IF NOT EXISTS idx_work_items_is_note ON work_items(is_note) WHERE is_note = true;

-- 4. Enable RLS on work_flows
ALTER TABLE work_flows ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for work_flows
-- Allow team members to SELECT their flows
CREATE POLICY "Team members can view their flows"
  ON work_flows FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Allow team members to INSERT flows
CREATE POLICY "Team members can create flows"
  ON work_flows FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Allow team members to UPDATE their flows
CREATE POLICY "Team members can update their flows"
  ON work_flows FOR UPDATE
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Allow team members to DELETE their flows
CREATE POLICY "Team members can delete their flows"
  ON work_flows FOR DELETE
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- 6. Add trigger to update work_flows updated_at
CREATE OR REPLACE FUNCTION update_work_flows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_work_flows_updated_at_trigger
  BEFORE UPDATE ON work_flows
  FOR EACH ROW
  EXECUTE FUNCTION update_work_flows_updated_at();

-- 7. Add trigger to auto-update flow counts
CREATE OR REPLACE FUNCTION update_flow_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update parent flow's child_count
  IF NEW.parent_flow_id IS NOT NULL THEN
    UPDATE work_flows
    SET child_count = (
      SELECT COUNT(*) FROM work_flows WHERE parent_flow_id = NEW.parent_flow_id
    )
    WHERE id = NEW.parent_flow_id;
  END IF;

  -- Update flow's work_item_count
  IF NEW.flow_id IS NOT NULL THEN
    UPDATE work_flows
    SET work_item_count = (
      SELECT COUNT(*) FROM work_items WHERE flow_id = NEW.flow_id
    )
    WHERE id = NEW.flow_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_flow_counts_on_flow_insert
  AFTER INSERT ON work_flows
  FOR EACH ROW
  EXECUTE FUNCTION update_flow_counts();

CREATE TRIGGER update_flow_counts_on_item_insert
  AFTER INSERT ON work_items
  FOR EACH ROW
  EXECUTE FUNCTION update_flow_counts();

CREATE TRIGGER update_flow_counts_on_item_update
  AFTER UPDATE ON work_items
  FOR EACH ROW
  WHEN (OLD.flow_id IS DISTINCT FROM NEW.flow_id)
  EXECUTE FUNCTION update_flow_counts();
