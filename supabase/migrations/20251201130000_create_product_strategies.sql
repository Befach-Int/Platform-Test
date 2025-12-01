-- ============================================================================
-- Migration: Create Product Strategies (OKRs/Pillars System)
-- Date: 2025-12-01
-- Purpose: Hierarchical strategy management with work item alignment
-- Tables: product_strategies, work_item_strategies (junction)
-- Features: Hybrid progress (auto + manual), multi-tenant RLS
-- ============================================================================

-- ============================================================================
-- TABLE 1: product_strategies - Core strategy table
-- Hierarchy: Pillar > Objective > Key Result > Initiative
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.product_strategies (
  -- Primary key (timestamp-based TEXT, not UUID)
  id TEXT PRIMARY KEY DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT::TEXT,

  -- Multi-tenant isolation (REQUIRED)
  team_id TEXT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  workspace_id TEXT REFERENCES public.workspaces(id) ON DELETE SET NULL,

  -- Hierarchy
  type TEXT NOT NULL CHECK (type IN ('pillar', 'objective', 'key_result', 'initiative')),
  parent_id TEXT REFERENCES public.product_strategies(id) ON DELETE CASCADE,

  -- Core fields
  title TEXT NOT NULL,
  description TEXT,

  -- Dates
  start_date DATE,
  target_date DATE,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled', 'on_hold')),

  -- Hybrid Progress System
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  progress_mode TEXT DEFAULT 'auto' CHECK (progress_mode IN ('auto', 'manual')),
  calculated_progress INTEGER DEFAULT 0 CHECK (calculated_progress >= 0 AND calculated_progress <= 100),

  -- Metrics (primarily for Key Results)
  metric_name TEXT,
  metric_current DECIMAL,
  metric_target DECIMAL,
  metric_unit TEXT,

  -- Ownership
  owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

  -- Display
  color TEXT DEFAULT '#6366f1',
  sort_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Self-reference constraint: prevent circular references (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_strategies_no_self_parent'
  ) THEN
    ALTER TABLE public.product_strategies
      ADD CONSTRAINT product_strategies_no_self_parent
      CHECK (id != parent_id OR parent_id IS NULL);
  END IF;
END $$;

-- Comments
COMMENT ON TABLE public.product_strategies IS 'Hierarchical product strategies (Pillars, Objectives, Key Results, Initiatives)';
COMMENT ON COLUMN public.product_strategies.type IS 'Strategy type: pillar (top), objective, key_result, initiative (bottom)';
COMMENT ON COLUMN public.product_strategies.progress IS 'Displayed progress value (0-100)';
COMMENT ON COLUMN public.product_strategies.progress_mode IS 'auto=calculated from children/metrics, manual=user override';
COMMENT ON COLUMN public.product_strategies.calculated_progress IS 'Auto-computed progress from children or metrics';
COMMENT ON COLUMN public.product_strategies.metric_name IS 'For Key Results: name of metric being tracked';
COMMENT ON COLUMN public.product_strategies.metric_current IS 'For Key Results: current metric value';
COMMENT ON COLUMN public.product_strategies.metric_target IS 'For Key Results: target metric value';

-- ============================================================================
-- TABLE 2: work_item_strategies - Junction table for ADDITIONAL alignments
-- (Primary alignment uses strategy_id FK on work_items)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.work_item_strategies (
  -- Primary key
  id TEXT PRIMARY KEY DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT::TEXT,

  -- Foreign keys
  work_item_id TEXT NOT NULL REFERENCES public.work_items(id) ON DELETE CASCADE,
  strategy_id TEXT NOT NULL REFERENCES public.product_strategies(id) ON DELETE CASCADE,

  -- Alignment metadata
  alignment_strength TEXT DEFAULT 'medium' CHECK (alignment_strength IN ('weak', 'medium', 'strong')),
  notes TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one alignment per work_item-strategy pair
  UNIQUE(work_item_id, strategy_id)
);

-- Comments
COMMENT ON TABLE public.work_item_strategies IS 'Junction table for additional (non-primary) work item to strategy alignments';
COMMENT ON COLUMN public.work_item_strategies.alignment_strength IS 'How strongly this work item contributes: weak, medium, strong';
COMMENT ON COLUMN public.work_item_strategies.notes IS 'User notes explaining the alignment';

-- ============================================================================
-- ALTER work_items: Add strategy_id FK for PRIMARY alignment
-- ============================================================================

ALTER TABLE public.work_items
  ADD COLUMN IF NOT EXISTS strategy_id TEXT REFERENCES public.product_strategies(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.work_items.strategy_id IS 'Primary strategy alignment for this work item';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- product_strategies indexes
CREATE INDEX IF NOT EXISTS idx_product_strategies_team_id
  ON public.product_strategies(team_id);

CREATE INDEX IF NOT EXISTS idx_product_strategies_workspace_id
  ON public.product_strategies(workspace_id);

CREATE INDEX IF NOT EXISTS idx_product_strategies_parent_id
  ON public.product_strategies(parent_id);

CREATE INDEX IF NOT EXISTS idx_product_strategies_type
  ON public.product_strategies(type);

CREATE INDEX IF NOT EXISTS idx_product_strategies_status
  ON public.product_strategies(status);

-- Active strategies partial index
CREATE INDEX IF NOT EXISTS idx_product_strategies_active
  ON public.product_strategies(team_id, workspace_id, type)
  WHERE status = 'active';

-- work_item_strategies indexes
CREATE INDEX IF NOT EXISTS idx_work_item_strategies_work_item
  ON public.work_item_strategies(work_item_id);

CREATE INDEX IF NOT EXISTS idx_work_item_strategies_strategy
  ON public.work_item_strategies(strategy_id);

-- work_items.strategy_id index (for primary alignment lookups)
CREATE INDEX IF NOT EXISTS idx_work_items_strategy_id
  ON public.work_items(strategy_id);

-- ============================================================================
-- TRIGGERS: Auto-update timestamps (idempotent)
-- ============================================================================

DROP TRIGGER IF EXISTS update_product_strategies_updated_at ON public.product_strategies;
CREATE TRIGGER update_product_strategies_updated_at
  BEFORE UPDATE ON public.product_strategies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE public.product_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_item_strategies ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: product_strategies table (idempotent)
-- ============================================================================

-- SELECT: Team members can view strategies
DROP POLICY IF EXISTS "Team members can view strategies" ON public.product_strategies;
CREATE POLICY "Team members can view strategies"
  ON public.product_strategies FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members WHERE user_id = (SELECT auth.uid())
    )
  );

-- INSERT: Team members can create strategies
DROP POLICY IF EXISTS "Team members can create strategies" ON public.product_strategies;
CREATE POLICY "Team members can create strategies"
  ON public.product_strategies FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM public.team_members WHERE user_id = (SELECT auth.uid())
    )
  );

-- UPDATE: Team members can update strategies in their team
DROP POLICY IF EXISTS "Team members can update strategies" ON public.product_strategies;
CREATE POLICY "Team members can update strategies"
  ON public.product_strategies FOR UPDATE
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members WHERE user_id = (SELECT auth.uid())
    )
  );

-- DELETE: Only admins/owners can delete strategies
DROP POLICY IF EXISTS "Admins can delete strategies" ON public.product_strategies;
CREATE POLICY "Admins can delete strategies"
  ON public.product_strategies FOR DELETE
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = (SELECT auth.uid()) AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- RLS POLICIES: work_item_strategies table (idempotent)
-- ============================================================================

-- SELECT: Team members can view work item strategy alignments
DROP POLICY IF EXISTS "Team members can view work item strategies" ON public.work_item_strategies;
CREATE POLICY "Team members can view work item strategies"
  ON public.work_item_strategies FOR SELECT
  USING (
    work_item_id IN (
      SELECT wi.id FROM public.work_items wi
      JOIN public.team_members tm ON wi.team_id = tm.team_id
      WHERE tm.user_id = (SELECT auth.uid())
    )
  );

-- INSERT: Team members can create alignments
DROP POLICY IF EXISTS "Team members can create work item strategies" ON public.work_item_strategies;
CREATE POLICY "Team members can create work item strategies"
  ON public.work_item_strategies FOR INSERT
  WITH CHECK (
    work_item_id IN (
      SELECT wi.id FROM public.work_items wi
      JOIN public.team_members tm ON wi.team_id = tm.team_id
      WHERE tm.user_id = (SELECT auth.uid())
    )
  );

-- UPDATE: Team members can update alignments
DROP POLICY IF EXISTS "Team members can update work item strategies" ON public.work_item_strategies;
CREATE POLICY "Team members can update work item strategies"
  ON public.work_item_strategies FOR UPDATE
  USING (
    work_item_id IN (
      SELECT wi.id FROM public.work_items wi
      JOIN public.team_members tm ON wi.team_id = tm.team_id
      WHERE tm.user_id = (SELECT auth.uid())
    )
  );

-- DELETE: Team members can remove alignments
DROP POLICY IF EXISTS "Team members can delete work item strategies" ON public.work_item_strategies;
CREATE POLICY "Team members can delete work item strategies"
  ON public.work_item_strategies FOR DELETE
  USING (
    work_item_id IN (
      SELECT wi.id FROM public.work_items wi
      JOIN public.team_members tm ON wi.team_id = tm.team_id
      WHERE tm.user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- FUNCTION: Calculate strategy progress
-- Calculates progress based on type (from metrics or children)
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_strategy_progress(strategy_id_param TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  strategy_type TEXT;
  metric_cur DECIMAL;
  metric_tgt DECIMAL;
  child_avg INTEGER;
  result INTEGER;
BEGIN
  -- Get strategy type and metrics
  SELECT type, metric_current, metric_target
  INTO strategy_type, metric_cur, metric_tgt
  FROM product_strategies
  WHERE id = strategy_id_param;

  IF strategy_type IS NULL THEN
    RETURN 0;
  END IF;

  -- Key Results: Calculate from metrics
  IF strategy_type = 'key_result' THEN
    IF metric_tgt IS NOT NULL AND metric_tgt > 0 AND metric_cur IS NOT NULL THEN
      result := LEAST(100, GREATEST(0, ROUND((metric_cur / metric_tgt) * 100)::INTEGER));
    ELSE
      result := 0;
    END IF;
  ELSE
    -- Pillars, Objectives, Initiatives: Average of children's progress
    SELECT COALESCE(AVG(
      CASE WHEN progress_mode = 'auto' THEN calculated_progress ELSE progress END
    ), 0)::INTEGER
    INTO child_avg
    FROM product_strategies
    WHERE parent_id = strategy_id_param;

    result := child_avg;
  END IF;

  RETURN result;
END;
$$;

COMMENT ON FUNCTION calculate_strategy_progress IS 'Calculates progress for a strategy based on its type (metrics for KRs, child average for others)';

-- ============================================================================
-- FUNCTION: Update calculated_progress for a strategy and its ancestors
-- ============================================================================

CREATE OR REPLACE FUNCTION update_strategy_calculated_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_id TEXT;
  parent_strategy_id TEXT;
BEGIN
  -- Start with the affected strategy
  IF TG_OP = 'DELETE' THEN
    current_id := OLD.parent_id;
  ELSE
    current_id := COALESCE(NEW.id, OLD.id);
  END IF;

  -- Update this strategy's calculated_progress
  UPDATE product_strategies
  SET calculated_progress = calculate_strategy_progress(current_id)
  WHERE id = current_id;

  -- Walk up the hierarchy and update ancestors
  SELECT parent_id INTO parent_strategy_id
  FROM product_strategies
  WHERE id = current_id;

  WHILE parent_strategy_id IS NOT NULL LOOP
    UPDATE product_strategies
    SET calculated_progress = calculate_strategy_progress(parent_strategy_id)
    WHERE id = parent_strategy_id;

    SELECT parent_id INTO parent_strategy_id
    FROM product_strategies
    WHERE id = parent_strategy_id;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Trigger to update calculated_progress when strategy changes (idempotent)
DROP TRIGGER IF EXISTS update_strategy_progress_on_change ON public.product_strategies;
CREATE TRIGGER update_strategy_progress_on_change
  AFTER INSERT OR UPDATE OF progress, progress_mode, metric_current, metric_target, parent_id
  ON public.product_strategies
  FOR EACH ROW
  EXECUTE FUNCTION update_strategy_calculated_progress();

-- Trigger to update parent calculated_progress when child is deleted (idempotent)
DROP TRIGGER IF EXISTS update_parent_progress_on_delete ON public.product_strategies;
CREATE TRIGGER update_parent_progress_on_delete
  AFTER DELETE
  ON public.product_strategies
  FOR EACH ROW
  EXECUTE FUNCTION update_strategy_calculated_progress();

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_strategies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_item_strategies TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
