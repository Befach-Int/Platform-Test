-- Debug Script for Workspace Creation Issues
-- Run these queries in Supabase SQL Editor to diagnose the problem

-- 1. Check if public.users trigger is creating records
-- (Should show recent users who signed up)
SELECT id, email, created_at, full_name
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check if trigger exists and is enabled
SELECT tgname, tgenabled, proname
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';

-- 3. Check workspaces table schema (should NOT have user_id column)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'workspaces'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check current RLS policies on workspaces
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'workspaces'
ORDER BY policyname;

-- 5. Check if team_members table has proper RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'team_members'
ORDER BY policyname;

-- 6. Test team membership function (replace 'YOUR_USER_UUID' with actual UUID)
-- SELECT user_is_team_member('team_id_here');

-- 7. Check recent teams created
SELECT id, name, owner_id, created_at
FROM teams
ORDER BY created_at DESC
LIMIT 10;

-- 8. Check recent team_members
SELECT tm.team_id, tm.user_id, tm.role, t.name as team_name, u.email
FROM team_members tm
JOIN teams t ON tm.team_id = t.id
LEFT JOIN public.users u ON tm.user_id = u.id
ORDER BY tm.created_at DESC
LIMIT 10;

-- 9. Check recent workspaces (to see if ANY were created successfully)
SELECT w.id, w.name, w.team_id, t.name as team_name, w.created_at
FROM workspaces w
LEFT JOIN teams t ON w.team_id = t.id
ORDER BY w.created_at DESC
LIMIT 10;

-- 10. Check for any RLS policy violations in logs
-- (You'll need to check Supabase Dashboard → Database → Logs for this)
