-- =============================================================================
-- DevCrew — Feature 5: Developer task update + notification RLS
-- Run in Supabase SQL Editor
-- =============================================================================

-- Developers can update status on their assigned tasks
create policy "developer_tasks_update" on tasks for update to authenticated
  using (get_user_role() = 'developer' and assignee_id = auth.uid())
  with check (get_user_role() = 'developer' and assignee_id = auth.uid());

-- Developers can insert notifications (e.g. status updates to task creator)
create policy "developer_notifications_insert" on notifications for insert to authenticated
  with check (get_user_role() = 'developer');
