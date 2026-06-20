-- =============================================================================
-- DevCrew — Feature 8: Enable Realtime on notifications
-- Run in Supabase SQL Editor (skip if already enabled)
-- =============================================================================

alter publication supabase_realtime add table notifications;
