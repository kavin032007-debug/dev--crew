-- =============================================================================
-- Migration 005: Manager project delete policy
-- Run in Supabase SQL Editor
-- =============================================================================

-- created_by column already exists in projects table from 001_initial_schema.sql
-- This migration adds the RLS policy that allows managers to delete their own projects.

create policy "manager_projects_delete" on projects for delete to authenticated
  using (get_user_role() = 'manager' and created_by = auth.uid());
