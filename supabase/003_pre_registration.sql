-- =============================================================================
-- DevCrew — Feature 7: Pre-registration support
-- Run in Supabase SQL Editor
-- =============================================================================

-- Remove FK so SA can pre-register users before their first OAuth sign-in.
-- On first Google sign-in, handle_new_user merges the auth id into the existing row.
alter table users drop constraint if exists users_id_fkey;

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url, is_active)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    false
  )
  on conflict (email) do update set
    id = excluded.id,
    full_name = coalesce(public.users.full_name, excluded.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url);
  -- role, is_active, pending_role preserved from pre-registration row
  return new;
end;
$$ language plpgsql security definer;
