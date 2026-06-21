-- =============================================================================
-- Migration 006: Avatar storage bucket + policy
-- Run in Supabase SQL Editor
-- =============================================================================

-- Create the avatars bucket (public so avatar URLs work without auth tokens)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict do nothing;

-- Storage policy: any authenticated user can read/write to their own path
create policy "avatar_upload" on storage.objects
  for all to authenticated
  with check (bucket_id = 'avatars');
