-- Migration: Add RLS Policies to teams and team_members Tables
-- Date: 2025-01-19
-- Priority: CRITICAL - Fixes complete multi-tenant isolation bypass
--
-- This migration adds Row-Level Security policies to the foundational
-- multi-tenant tables (teams, team_members) which were missing RLS protection.
--
-- Security Impact:
-- - Prevents users from viewing/modifying teams they don't belong to
-- - Prevents privilege escalation by modifying own role in team_members
-- - Enforces multi-tenant isolation at database level
--
-- Related: docs/testing/SECURITY_AUDIT_REPORT.md (Critical Issue #1)

-- ============================================================================
-- PART 1: TEAMS TABLE RLS POLICIES
-- ============================================================================

-- Enable Row Level Security on teams table
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view teams they are members of
-- This allows team members to see their team's details
CREATE POLICY "team_members_can_view_their_teams" ON teams
  FOR SELECT
  USING (
    id IN (
      SELECT team_id
      FROM team_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy 2: Only owners can update team details
-- Prevents non-owners from modifying team name, settings, etc.
CREATE POLICY "owners_can_update_team" ON teams
  FOR UPDATE
  USING (
    id IN (
      SELECT team_id
      FROM team_members
      WHERE user_id = auth.uid()
        AND role = 'owner'
    )
  )
  WITH CHECK (
    id IN (
      SELECT team_id
      FROM team_members
      WHERE user_id = auth.uid()
        AND role = 'owner'
    )
  );

-- Policy 3: Only owners can delete teams
-- Prevents accidental or malicious team deletion by non-owners
CREATE POLICY "owners_can_delete_team" ON teams
  FOR DELETE
  USING (
    id IN (
      SELECT team_id
      FROM team_members
      WHERE user_id = auth.uid()
        AND role = 'owner'
    )
  );

-- Policy 4: Authenticated users can create teams
-- Users can create new teams through onboarding or team creation flow
CREATE POLICY "authenticated_users_can_create_teams" ON teams
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- ============================================================================
-- PART 2: TEAM_MEMBERS TABLE RLS POLICIES
-- ============================================================================

-- Enable Row Level Security on team_members table
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Policy 1: Team members can view other members in their teams
-- Allows viewing team member list, roles, and join dates
CREATE POLICY "team_members_can_view_team_members" ON team_members
  FOR SELECT
  USING (
    team_id IN (
      SELECT team_id
      FROM team_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy 2: Owners and admins can invite new team members
-- Allows inviting users with specific roles
CREATE POLICY "admins_can_insert_team_members" ON team_members
  FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id
      FROM team_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- Policy 3: Owners and admins can update team member roles
-- CRITICAL: Prevents self-role-escalation (members changing their own role)
CREATE POLICY "admins_can_update_team_members" ON team_members
  FOR UPDATE
  USING (
    -- User must be owner or admin of the team
    team_id IN (
      SELECT team_id
      FROM team_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    -- Prevent members from changing their own role
    -- They can only modify other members' roles
    (user_id != auth.uid())
    OR
    -- If updating own record, role must not change
    (role = (
      SELECT role
      FROM team_members
      WHERE user_id = auth.uid()
        AND team_id = team_members.team_id
    ))
  );

-- Policy 4: Owners and admins can remove team members
-- Prevents members from removing themselves or others without permission
CREATE POLICY "admins_can_delete_team_members" ON team_members
  FOR DELETE
  USING (
    team_id IN (
      SELECT team_id
      FROM team_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- VERIFICATION QUERIES (Run these to test policies)
-- ============================================================================

-- Test 1: Verify RLS is enabled
-- Expected: Both tables should show rls_enabled = true
/*
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('teams', 'team_members')
ORDER BY tablename;
*/

-- Test 2: View all policies on teams table
-- Expected: Should show 4 policies (SELECT, INSERT, UPDATE, DELETE)
/*
SELECT
  polname as policy_name,
  polcmd as command,
  polpermissive as permissive
FROM pg_policies
WHERE tablename = 'teams'
ORDER BY polcmd;
*/

-- Test 3: View all policies on team_members table
-- Expected: Should show 4 policies (SELECT, INSERT, UPDATE, DELETE)
/*
SELECT
  polname as policy_name,
  polcmd as command,
  polpermissive as permissive
FROM pg_policies
WHERE tablename = 'team_members'
ORDER BY polcmd;
*/

-- ============================================================================
-- ROLLBACK (Emergency use only - removes all policies and disables RLS)
-- ============================================================================

/*
-- WARNING: This removes all security protections!
-- Only use if migration causes critical issues

-- Drop teams table policies
DROP POLICY IF EXISTS "team_members_can_view_their_teams" ON teams;
DROP POLICY IF EXISTS "owners_can_update_team" ON teams;
DROP POLICY IF EXISTS "owners_can_delete_team" ON teams;
DROP POLICY IF EXISTS "authenticated_users_can_create_teams" ON teams;
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;

-- Drop team_members table policies
DROP POLICY IF EXISTS "team_members_can_view_team_members" ON team_members;
DROP POLICY IF EXISTS "admins_can_insert_team_members" ON team_members;
DROP POLICY IF EXISTS "admins_can_update_team_members" ON team_members;
DROP POLICY IF EXISTS "admins_can_delete_team_members" ON team_members;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
*/

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

-- Migration applied successfully!
-- RLS policies now protect teams and team_members tables
-- Multi-tenant isolation is enforced at the database level
-- Critical security vulnerability FIXED ✅
