-- Add workflow pipeline system to features and workspaces
-- Enables stage-based progressive disclosure of features
-- Migration: 20250112000001_add_workflow_stages.sql

-- ========== WORKFLOW STAGES FOR FEATURES ==========

-- Add workflow stage tracking to features
ALTER TABLE features ADD COLUMN IF NOT EXISTS workflow_stage TEXT DEFAULT 'ideation'
    CHECK (workflow_stage IN ('ideation', 'planning', 'execution', 'completed'));

-- Add stage transition history (JSONB array)
ALTER TABLE features ADD COLUMN IF NOT EXISTS stage_history JSONB DEFAULT '[]'::jsonb;

-- Stage readiness check (true when ready to advance)
ALTER TABLE features ADD COLUMN IF NOT EXISTS stage_ready_to_advance BOOLEAN DEFAULT false;

-- Stage completion percentage (0-100)
ALTER TABLE features ADD COLUMN IF NOT EXISTS stage_completion_percent NUMERIC(5,2) DEFAULT 0
    CHECK (stage_completion_percent >= 0 AND stage_completion_percent <= 100);

-- ========== WORKFLOW CONFIGURATION FOR WORKSPACES ==========

-- Enable/disable workflow mode per workspace
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS workflow_mode_enabled BOOLEAN DEFAULT false;

-- Workspace-level workflow configuration
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS workflow_config JSONB DEFAULT '{
    "enableIdeationStage": true,
    "enablePlanningStage": true,
    "enableExecutionStage": true,
    "autoAdvanceStages": false,
    "showStageGuides": true,
    "stageRequirements": {
        "ideation": ["inspirationItems", "risks"],
        "planning": ["executionSteps", "milestones"],
        "execution": ["status", "progress"]
    }
}'::jsonb;

-- ========== CREATE INDEXES ==========

CREATE INDEX IF NOT EXISTS idx_features_workflow_stage ON features(workflow_stage);
CREATE INDEX IF NOT EXISTS idx_features_stage_ready ON features(stage_ready_to_advance);
CREATE INDEX IF NOT EXISTS idx_workspaces_workflow_enabled ON workspaces(workflow_mode_enabled);

-- Create composite index for workspace + stage queries
CREATE INDEX IF NOT EXISTS idx_features_workspace_stage ON features(workspace_id, workflow_stage);

-- ========== UPDATE EXISTING RECORDS ==========

-- Set default workflow stage for existing features
UPDATE features
SET workflow_stage = 'ideation',
    stage_completion_percent = 0
WHERE workflow_stage IS NULL;

-- Initialize stage history for existing features
UPDATE features
SET stage_history = jsonb_build_array(
    jsonb_build_object(
        'stage', 'ideation',
        'enteredAt', created_at,
        'enteredBy', 'system',
        'notes', 'Initial stage assignment'
    )
)
WHERE stage_history = '[]'::jsonb OR stage_history IS NULL;

-- ========== COMMENTS FOR DOCUMENTATION ==========

COMMENT ON COLUMN features.workflow_stage IS 'Current workflow stage: ideation, planning, execution, completed';
COMMENT ON COLUMN features.stage_history IS 'Array of stage transitions with timestamps and notes';
COMMENT ON COLUMN features.stage_ready_to_advance IS 'Boolean flag indicating if feature meets criteria to advance to next stage';
COMMENT ON COLUMN features.stage_completion_percent IS 'Completion percentage for current stage (0-100)';
COMMENT ON COLUMN workspaces.workflow_mode_enabled IS 'Enable stage-based workflow for this workspace';
COMMENT ON COLUMN workspaces.workflow_config IS 'Workspace-specific workflow configuration and requirements';

-- ========== CREATE HELPER FUNCTIONS ==========

-- Function to check stage readiness
CREATE OR REPLACE FUNCTION check_stage_readiness(feature_id_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    f_stage TEXT;
    f_inspiration_count INT;
    f_risks_count INT;
    f_execution_steps_count INT;
    f_milestones_count INT;
    f_has_purpose BOOLEAN;
BEGIN
    -- Get feature data
    SELECT
        workflow_stage,
        COALESCE(jsonb_array_length(COALESCE(inspiration_items, '[]'::jsonb)), 0),
        COALESCE(jsonb_array_length(COALESCE(risks, '[]'::jsonb)), 0),
        COALESCE(jsonb_array_length(COALESCE(execution_steps, '[]'::jsonb)), 0),
        COALESCE(jsonb_array_length(COALESCE(milestones, '[]'::jsonb)), 0),
        (purpose IS NOT NULL AND purpose != '')
    INTO
        f_stage,
        f_inspiration_count,
        f_risks_count,
        f_execution_steps_count,
        f_milestones_count,
        f_has_purpose
    FROM features
    WHERE id = feature_id_param;

    -- Check readiness based on stage
    IF f_stage = 'ideation' THEN
        RETURN (f_inspiration_count >= 2 AND f_risks_count >= 1 AND f_has_purpose);
    ELSIF f_stage = 'planning' THEN
        RETURN (f_execution_steps_count >= 3 AND f_milestones_count >= 2);
    ELSIF f_stage = 'execution' THEN
        RETURN true; -- Execution stage can always advance to completed
    ELSE
        RETURN false;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to advance feature to next stage
CREATE OR REPLACE FUNCTION advance_feature_stage(
    feature_id_param TEXT,
    advanced_by TEXT DEFAULT 'user',
    notes TEXT DEFAULT ''
)
RETURNS TEXT AS $$
DECLARE
    current_stage TEXT;
    next_stage TEXT;
    history_entry JSONB;
BEGIN
    -- Get current stage
    SELECT workflow_stage INTO current_stage
    FROM features
    WHERE id = feature_id_param;

    -- Determine next stage
    next_stage := CASE current_stage
        WHEN 'ideation' THEN 'planning'
        WHEN 'planning' THEN 'execution'
        WHEN 'execution' THEN 'completed'
        ELSE current_stage
    END;

    -- Build history entry
    history_entry := jsonb_build_object(
        'stage', next_stage,
        'enteredAt', NOW(),
        'enteredBy', advanced_by,
        'notes', COALESCE(notes, 'Stage advancement'),
        'previousStage', current_stage
    );

    -- Update feature
    UPDATE features
    SET workflow_stage = next_stage,
        stage_history = COALESCE(stage_history, '[]'::jsonb) || history_entry,
        stage_completion_percent = 0,
        stage_ready_to_advance = false,
        updated_at = NOW()
    WHERE id = feature_id_param;

    RETURN next_stage;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate stage completion percentage
CREATE OR REPLACE FUNCTION calculate_stage_completion(feature_id_param TEXT)
RETURNS NUMERIC AS $$
DECLARE
    f_stage TEXT;
    f_inspiration_count INT;
    f_risks_count INT;
    f_execution_steps_count INT;
    f_milestones_count INT;
    f_has_purpose BOOLEAN;
    total_requirements INT;
    met_requirements INT;
BEGIN
    -- Get feature data
    SELECT
        workflow_stage,
        COALESCE(jsonb_array_length(COALESCE(inspiration_items, '[]'::jsonb)), 0),
        COALESCE(jsonb_array_length(COALESCE(risks, '[]'::jsonb)), 0),
        COALESCE(jsonb_array_length(COALESCE(execution_steps, '[]'::jsonb)), 0),
        COALESCE(jsonb_array_length(COALESCE(milestones, '[]'::jsonb)), 0),
        (purpose IS NOT NULL AND purpose != '')
    INTO
        f_stage,
        f_inspiration_count,
        f_risks_count,
        f_execution_steps_count,
        f_milestones_count,
        f_has_purpose
    FROM features
    WHERE id = feature_id_param;

    -- Calculate based on stage
    IF f_stage = 'ideation' THEN
        total_requirements := 3;
        met_requirements := 0;

        IF f_inspiration_count >= 2 THEN met_requirements := met_requirements + 1; END IF;
        IF f_risks_count >= 1 THEN met_requirements := met_requirements + 1; END IF;
        IF f_has_purpose THEN met_requirements := met_requirements + 1; END IF;

    ELSIF f_stage = 'planning' THEN
        total_requirements := 2;
        met_requirements := 0;

        IF f_execution_steps_count >= 3 THEN met_requirements := met_requirements + 1; END IF;
        IF f_milestones_count >= 2 THEN met_requirements := met_requirements + 1; END IF;

    ELSE
        -- Execution or completed
        RETURN 100;
    END IF;

    -- Calculate percentage
    IF total_requirements > 0 THEN
        RETURN ROUND((met_requirements::NUMERIC / total_requirements::NUMERIC) * 100, 2);
    ELSE
        RETURN 100;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ========== TRIGGER TO AUTO-UPDATE STAGE READINESS ==========

-- Create trigger function to update stage readiness
CREATE OR REPLACE FUNCTION update_stage_readiness()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if workflow is relevant for this feature
    IF NEW.workflow_stage IS NOT NULL AND NEW.workflow_stage != 'completed' THEN
        NEW.stage_ready_to_advance := check_stage_readiness(NEW.id);
        NEW.stage_completion_percent := calculate_stage_completion(NEW.id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on features table
DROP TRIGGER IF EXISTS trigger_update_stage_readiness ON features;
CREATE TRIGGER trigger_update_stage_readiness
    BEFORE UPDATE ON features
    FOR EACH ROW
    EXECUTE FUNCTION update_stage_readiness();

-- ========== GRANT PERMISSIONS ==========

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION check_stage_readiness(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION advance_feature_stage(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION calculate_stage_completion(TEXT) TO anon, authenticated;

-- ========== MIGRATION COMPLETE ==========

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Workflow stages migration completed successfully';
    RAISE NOTICE 'Features table: Added workflow_stage, stage_history, stage_ready_to_advance, stage_completion_percent';
    RAISE NOTICE 'Workspaces table: Added workflow_mode_enabled, workflow_config';
    RAISE NOTICE 'Created 4 indexes for workflow queries';
    RAISE NOTICE 'Created 3 helper functions: check_stage_readiness, advance_feature_stage, calculate_stage_completion';
    RAISE NOTICE 'Created 1 trigger: trigger_update_stage_readiness';
END $$;
