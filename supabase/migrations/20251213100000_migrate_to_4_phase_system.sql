-- Migration: Update phase system from 5-phase to 4-phase
-- Old phases: research, planning, execution, review, complete
-- New phases: design, build, refine, launch
-- Date: 2025-12-13

-- ============================================================================
-- STEP 1: Update existing data to new phase values
-- ============================================================================

-- Update user_phase_assignments
UPDATE user_phase_assignments SET phase =
  CASE phase
    WHEN 'research' THEN 'design'
    WHEN 'planning' THEN 'design'
    WHEN 'execution' THEN 'build'
    WHEN 'review' THEN 'refine'
    WHEN 'complete' THEN 'launch'
    ELSE phase
  END
WHERE phase IN ('research', 'planning', 'execution', 'review', 'complete');

-- Update phase_assignment_history
UPDATE phase_assignment_history SET
  from_phase = CASE from_phase
    WHEN 'research' THEN 'design'
    WHEN 'planning' THEN 'design'
    WHEN 'execution' THEN 'build'
    WHEN 'review' THEN 'refine'
    WHEN 'complete' THEN 'launch'
    ELSE from_phase
  END,
  to_phase = CASE to_phase
    WHEN 'research' THEN 'design'
    WHEN 'planning' THEN 'design'
    WHEN 'execution' THEN 'build'
    WHEN 'review' THEN 'refine'
    WHEN 'complete' THEN 'launch'
    ELSE to_phase
  END
WHERE from_phase IN ('research', 'planning', 'execution', 'review', 'complete')
   OR to_phase IN ('research', 'planning', 'execution', 'review', 'complete');

-- Update phase_workload_cache
UPDATE phase_workload_cache SET phase =
  CASE phase
    WHEN 'research' THEN 'design'
    WHEN 'planning' THEN 'design'
    WHEN 'execution' THEN 'build'
    WHEN 'review' THEN 'refine'
    WHEN 'complete' THEN 'launch'
    ELSE phase
  END
WHERE phase IN ('research', 'planning', 'execution', 'review', 'complete');

-- Update phase_access_requests
UPDATE phase_access_requests SET phase =
  CASE phase
    WHEN 'research' THEN 'design'
    WHEN 'planning' THEN 'design'
    WHEN 'execution' THEN 'build'
    WHEN 'review' THEN 'refine'
    WHEN 'complete' THEN 'launch'
    ELSE phase
  END
WHERE phase IN ('research', 'planning', 'execution', 'review', 'complete');

-- Update work_items
UPDATE work_items SET phase =
  CASE phase
    WHEN 'research' THEN 'design'
    WHEN 'planning' THEN 'design'
    WHEN 'execution' THEN 'build'
    WHEN 'review' THEN 'refine'
    WHEN 'complete' THEN 'launch'
    ELSE phase
  END
WHERE phase IN ('research', 'planning', 'execution', 'review', 'complete');

-- Update timeline_items
UPDATE timeline_items SET phase =
  CASE phase
    WHEN 'research' THEN 'design'
    WHEN 'planning' THEN 'design'
    WHEN 'execution' THEN 'build'
    WHEN 'review' THEN 'refine'
    WHEN 'complete' THEN 'launch'
    ELSE phase
  END
WHERE phase IN ('research', 'planning', 'execution', 'review', 'complete');

-- ============================================================================
-- STEP 2: Drop old CHECK constraints
-- ============================================================================

-- user_phase_assignments
ALTER TABLE user_phase_assignments DROP CONSTRAINT IF EXISTS user_phase_assignments_phase_check;

-- phase_assignment_history
ALTER TABLE phase_assignment_history DROP CONSTRAINT IF EXISTS phase_assignment_history_from_phase_check;
ALTER TABLE phase_assignment_history DROP CONSTRAINT IF EXISTS phase_assignment_history_to_phase_check;

-- phase_workload_cache
ALTER TABLE phase_workload_cache DROP CONSTRAINT IF EXISTS phase_workload_cache_phase_check;

-- phase_access_requests
ALTER TABLE phase_access_requests DROP CONSTRAINT IF EXISTS phase_access_requests_phase_check;

-- ============================================================================
-- STEP 3: Add new CHECK constraints with 4-phase values
-- ============================================================================

-- user_phase_assignments
ALTER TABLE user_phase_assignments
ADD CONSTRAINT user_phase_assignments_phase_check
CHECK (phase IN ('design', 'build', 'refine', 'launch'));

-- phase_assignment_history
ALTER TABLE phase_assignment_history
ADD CONSTRAINT phase_assignment_history_from_phase_check
CHECK (from_phase IS NULL OR from_phase IN ('design', 'build', 'refine', 'launch'));

ALTER TABLE phase_assignment_history
ADD CONSTRAINT phase_assignment_history_to_phase_check
CHECK (to_phase IN ('design', 'build', 'refine', 'launch'));

-- phase_workload_cache
ALTER TABLE phase_workload_cache
ADD CONSTRAINT phase_workload_cache_phase_check
CHECK (phase IN ('design', 'build', 'refine', 'launch'));

-- phase_access_requests
ALTER TABLE phase_access_requests
ADD CONSTRAINT phase_access_requests_phase_check
CHECK (phase IN ('design', 'build', 'refine', 'launch'));

-- ============================================================================
-- STEP 4: Update default values
-- ============================================================================

-- Update timeline_items default from 'planning' to 'design'
ALTER TABLE timeline_items
ALTER COLUMN phase SET DEFAULT 'design';

-- ============================================================================
-- STEP 5: Update phase-related functions
-- ============================================================================

-- Update get_team_phase_stats function to use new phases
CREATE OR REPLACE FUNCTION get_team_phase_stats(
  p_workspace_id TEXT,
  p_team_id TEXT
)
RETURNS TABLE (
  phase TEXT,
  total_items BIGINT,
  total_leads BIGINT,
  total_contributors BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.phase_name::TEXT as phase,
    COALESCE(wi.item_count, 0)::BIGINT as total_items,
    COALESCE(pa.lead_count, 0)::BIGINT as total_leads,
    COALESCE(pa.contributor_count, 0)::BIGINT as total_contributors
  FROM (
    -- Use new 4-phase values
    VALUES ('design'), ('build'), ('refine'), ('launch')
  ) AS p(phase_name)
  LEFT JOIN (
    -- Count work items per phase
    SELECT
      phase,
      COUNT(*) as item_count
    FROM work_items
    WHERE workspace_id = p_workspace_id
      AND team_id = p_team_id
    GROUP BY phase
  ) wi ON wi.phase = p.phase_name
  LEFT JOIN (
    -- Count phase assignments
    SELECT
      upa.phase,
      SUM(CASE WHEN upa.is_lead THEN 1 ELSE 0 END) as lead_count,
      SUM(CASE WHEN upa.can_edit AND NOT upa.is_lead THEN 1 ELSE 0 END) as contributor_count
    FROM user_phase_assignments upa
    WHERE upa.workspace_id = p_workspace_id
      AND upa.team_id = p_team_id
    GROUP BY upa.phase
  ) pa ON pa.phase = p.phase_name
  ORDER BY
    CASE p.phase_name
      WHEN 'design' THEN 1
      WHEN 'build' THEN 2
      WHEN 'refine' THEN 3
      WHEN 'launch' THEN 4
    END;
END;
$$;

-- Update count_users_with_phase_edit_access function
CREATE OR REPLACE FUNCTION count_users_with_phase_edit_access(
  p_workspace_id TEXT,
  p_team_id TEXT,
  p_phase TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Count owners + admins + explicit phase assignments
  SELECT COUNT(DISTINCT tm.user_id) INTO v_count
  FROM team_members tm
  WHERE tm.team_id = p_team_id
    AND (
      tm.role IN ('owner', 'admin')
      OR EXISTS (
        SELECT 1 FROM user_phase_assignments upa
        WHERE upa.user_id = tm.user_id
          AND upa.workspace_id = p_workspace_id
          AND upa.team_id = p_team_id
          AND upa.phase = p_phase
          AND upa.can_edit = true
      )
    );

  RETURN v_count;
END;
$$;

-- ============================================================================
-- STEP 6: Add comment for documentation
-- ============================================================================

COMMENT ON TABLE user_phase_assignments IS
'Phase-based access control for team members.
4-Phase System (2025-12-13):
- design: Solution architecture, MVP scoping, timeline breakdown
- build: Active development, progress tracking, blocker resolution
- refine: User testing, feedback collection, polish iterations
- launch: Ship to production, metrics collection, retrospectives';

