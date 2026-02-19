-- Fix org_members RLS: the original "Members see own org members" policy
-- has a self-referencing subquery that causes infinite recursion.
--
-- Solution: Create a SECURITY DEFINER function to get the user's org_ids
-- bypassing RLS, then use it in a non-recursive policy.

-- Helper function: get org IDs for the current user (bypasses RLS)
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active';
$$;

-- Drop the recursive policy
DROP POLICY IF EXISTS "Members see own org members" ON org_members;
-- Drop the one we just created if re-running
DROP POLICY IF EXISTS "Users can read own membership" ON org_members;

-- Users can read members in their org (non-recursive via SECURITY DEFINER function)
CREATE POLICY "Members see own org members"
  ON org_members FOR SELECT
  USING (org_id IN (SELECT get_user_org_ids()));
