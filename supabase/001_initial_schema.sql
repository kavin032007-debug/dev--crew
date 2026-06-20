-- =============================================================================
-- DevCrew — Initial Database Schema
-- Run this entire file in the Supabase SQL Editor before any frontend work.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TABLES
-- -----------------------------------------------------------------------------

-- USERS
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  avatar_url text,
  role text check (role in ('super_admin', 'manager', 'developer')),
  pending_role text check (pending_role in ('manager', 'developer')),
  is_active boolean default false,
  created_at timestamptz default now()
);

-- PROJECTS
create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid references users(id),
  created_at timestamptz default now()
);

-- PROJECT MEMBERS
create table project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  unique(project_id, user_id)
);

-- TASKS
create table tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  project_id uuid references projects(id) on delete set null,
  assignee_id uuid references users(id) on delete set null,
  created_by uuid references users(id),
  status text default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  deadline date,
  allocated_at date default current_date,
  created_at timestamptz default now()
);

-- TASK RESPONSES (append-only developer logs)
create table task_responses (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  message text not null,
  created_at timestamptz default now()
);

-- NOTIFICATIONS
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  title text not null,
  message text not null,
  type text check (type in ('task_assigned', 'status_update', 'request_approved',
                             'request_rejected', 'task_comment')),
  related_task_id uuid references tasks(id) on delete set null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- INDEXES
-- -----------------------------------------------------------------------------

create index on tasks(assignee_id);
create index on tasks(project_id);
create index on project_members(user_id);
create index on project_members(project_id);
create index on notifications(user_id);
create index on notifications(is_read);

-- -----------------------------------------------------------------------------
-- AUTO-REGISTRATION TRIGGER
-- Fires when a new Google sign-in happens, creates a users row
-- -----------------------------------------------------------------------------

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
  on conflict (email) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------

alter table users enable row level security;
alter table projects enable row level security;
alter table project_members enable row level security;
alter table tasks enable row level security;
alter table task_responses enable row level security;
alter table notifications enable row level security;

-- Helper function to get current user role
create or replace function get_user_role()
returns text as $$
  select role from public.users where id = auth.uid();
$$ language sql security definer stable;

-- USERS policies
create policy "users_read_all" on users for select to authenticated using (true);
create policy "users_update_own" on users for update to authenticated
  using (id = auth.uid());
create policy "sa_users_all" on users for all to authenticated
  using (get_user_role() = 'super_admin')
  with check (get_user_role() = 'super_admin');

-- PROJECTS policies
create policy "projects_read" on projects for select to authenticated using (true);
create policy "manager_projects_insert" on projects for insert to authenticated
  with check (get_user_role() in ('manager', 'super_admin'));
create policy "sa_projects_all" on projects for all to authenticated
  using (get_user_role() = 'super_admin')
  with check (get_user_role() = 'super_admin');

-- PROJECT MEMBERS policies
create policy "pm_read" on project_members for select to authenticated using (true);
create policy "manager_pm_all" on project_members for all to authenticated
  using (get_user_role() in ('manager', 'super_admin'))
  with check (get_user_role() in ('manager', 'super_admin'));

-- TASKS policies
create policy "tasks_read" on tasks for select to authenticated using (true);
create policy "super_admin_tasks_all" on tasks for all to authenticated
  using (get_user_role() = 'super_admin')
  with check (get_user_role() = 'super_admin');
create policy "manager_tasks_all" on tasks for all to authenticated
  using (
    get_user_role() = 'manager' and (
      project_id is null or
      project_id in (
        select project_id from project_members where user_id = auth.uid()
      )
    )
  )
  with check (
    get_user_role() = 'manager' and (
      project_id is null or
      project_id in (
        select project_id from project_members where user_id = auth.uid()
      )
    )
  );
create policy "developer_tasks_read" on tasks for select to authenticated
  using (get_user_role() = 'developer' and assignee_id = auth.uid());

-- TASK RESPONSES policies
create policy "task_responses_read" on task_responses for select to authenticated
  using (true);
create policy "task_responses_insert" on task_responses for insert to authenticated
  with check (user_id = auth.uid());

-- NOTIFICATIONS policies
create policy "notifications_own" on notifications for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy "sa_notifications_insert" on notifications for insert to authenticated
  with check (get_user_role() in ('super_admin', 'manager'));
