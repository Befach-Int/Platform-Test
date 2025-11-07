-- Add comprehensive tracking columns to features table
-- These fields bring the app to professional roadmap tool standards

-- ========== CORE TRACKING FIELDS ==========

-- Status tracking
ALTER TABLE features ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'planning', 'in_progress', 'blocked', 'review', 'completed', 'on_hold', 'cancelled'));

-- Priority system
ALTER TABLE features ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium'
    CHECK (priority IN ('critical', 'high', 'medium', 'low'));

-- Health indicator
ALTER TABLE features ADD COLUMN IF NOT EXISTS health TEXT DEFAULT 'on_track'
    CHECK (health IN ('on_track', 'at_risk', 'off_track', 'unknown'));

-- ========== OWNERSHIP & ACCOUNTABILITY ==========
ALTER TABLE features ADD COLUMN IF NOT EXISTS owner TEXT;
ALTER TABLE features ADD COLUMN IF NOT EXISTS contributors TEXT[] DEFAULT '{}';
ALTER TABLE features ADD COLUMN IF NOT EXISTS stakeholders TEXT[] DEFAULT '{}';

-- ========== TIMELINE & DATES ==========
ALTER TABLE features ADD COLUMN IF NOT EXISTS planned_start_date DATE;
ALTER TABLE features ADD COLUMN IF NOT EXISTS actual_start_date DATE;
ALTER TABLE features ADD COLUMN IF NOT EXISTS planned_end_date DATE;
ALTER TABLE features ADD COLUMN IF NOT EXISTS actual_end_date DATE;
ALTER TABLE features ADD COLUMN IF NOT EXISTS target_release TEXT;  -- e.g., "Q1 2025" or "v2.3"

-- ========== EFFORT & ESTIMATION ==========
ALTER TABLE features ADD COLUMN IF NOT EXISTS story_points NUMERIC(5,1);
ALTER TABLE features ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC(10,2);
ALTER TABLE features ADD COLUMN IF NOT EXISTS actual_hours NUMERIC(10,2);
ALTER TABLE features ADD COLUMN IF NOT EXISTS effort_confidence TEXT DEFAULT 'medium'
    CHECK (effort_confidence IN ('high', 'medium', 'low'));

-- ========== PROGRESS TRACKING ==========
ALTER TABLE features ADD COLUMN IF NOT EXISTS progress_percent NUMERIC(5,2) DEFAULT 0
    CHECK (progress_percent >= 0 AND progress_percent <= 100);
ALTER TABLE features ADD COLUMN IF NOT EXISTS completed_steps INTEGER DEFAULT 0;
ALTER TABLE features ADD COLUMN IF NOT EXISTS total_steps INTEGER DEFAULT 0;

-- ========== BUSINESS VALUE ==========
ALTER TABLE features ADD COLUMN IF NOT EXISTS business_value TEXT DEFAULT 'medium'
    CHECK (business_value IN ('critical', 'high', 'medium', 'low'));
ALTER TABLE features ADD COLUMN IF NOT EXISTS customer_impact TEXT;
ALTER TABLE features ADD COLUMN IF NOT EXISTS strategic_alignment TEXT;
ALTER TABLE features ADD COLUMN IF NOT EXISTS success_metrics JSONB DEFAULT '[]'::jsonb;

-- ========== ACCEPTANCE & QUALITY ==========
ALTER TABLE features ADD COLUMN IF NOT EXISTS acceptance_criteria TEXT[] DEFAULT '{}';
ALTER TABLE features ADD COLUMN IF NOT EXISTS definition_of_done TEXT[] DEFAULT '{}';

-- ========== BLOCKERS ==========
ALTER TABLE features ADD COLUMN IF NOT EXISTS blockers JSONB DEFAULT '[]'::jsonb;
ALTER TABLE features ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;

-- ========== CATEGORIZATION ==========
ALTER TABLE features ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE features ADD COLUMN IF NOT EXISTS category TEXT;

-- ========== METADATA ==========
ALTER TABLE features ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE features ADD COLUMN IF NOT EXISTS last_modified_by TEXT;
ALTER TABLE features ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMPTZ;

-- ========== CREATE INDEXES FOR NEW COLUMNS ==========
CREATE INDEX IF NOT EXISTS idx_features_status ON features(status);
CREATE INDEX IF NOT EXISTS idx_features_priority ON features(priority);
CREATE INDEX IF NOT EXISTS idx_features_health ON features(health);
CREATE INDEX IF NOT EXISTS idx_features_owner ON features(owner);
CREATE INDEX IF NOT EXISTS idx_features_target_release ON features(target_release);
CREATE INDEX IF NOT EXISTS idx_features_planned_start_date ON features(planned_start_date);
CREATE INDEX IF NOT EXISTS idx_features_planned_end_date ON features(planned_end_date);
CREATE INDEX IF NOT EXISTS idx_features_business_value ON features(business_value);
CREATE INDEX IF NOT EXISTS idx_features_is_blocked ON features(is_blocked);
CREATE INDEX IF NOT EXISTS idx_features_category ON features(category);
CREATE INDEX IF NOT EXISTS idx_features_tags ON features USING GIN(tags);

-- ========== UPDATE DEFAULT VALUES FOR EXISTING RECORDS ==========
-- Set default status for existing features
UPDATE features
SET status = 'not_started'
WHERE status IS NULL;

-- Set default priority for existing features
UPDATE features
SET priority = 'medium'
WHERE priority IS NULL;

-- Set default health for existing features
UPDATE features
SET health = 'on_track'
WHERE health IS NULL;

-- Set default effort confidence for existing features
UPDATE features
SET effort_confidence = 'medium'
WHERE effort_confidence IS NULL;

-- Set default business value for existing features
UPDATE features
SET business_value = 'medium'
WHERE business_value IS NULL;

-- Set is_blocked to false for existing features
UPDATE features
SET is_blocked = false
WHERE is_blocked IS NULL;

-- ========== ADD COMMENTS FOR DOCUMENTATION ==========
COMMENT ON COLUMN features.status IS 'Current status of the feature in the development lifecycle';
COMMENT ON COLUMN features.priority IS 'Priority level for feature implementation';
COMMENT ON COLUMN features.health IS 'Overall health indicator based on progress, blockers, and timeline';
COMMENT ON COLUMN features.owner IS 'Primary owner responsible for feature delivery';
COMMENT ON COLUMN features.progress_percent IS 'Calculated progress percentage based on completed steps/milestones';
COMMENT ON COLUMN features.business_value IS 'Business value/impact assessment';
COMMENT ON COLUMN features.blockers IS 'Array of blocker objects with id, description, severity, status, owner';
COMMENT ON COLUMN features.success_metrics IS 'Array of success metrics with metric name, target, and actual values';
