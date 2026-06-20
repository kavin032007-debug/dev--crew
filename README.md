# DevCrew

Agile project management platform built with React + Vite + Supabase.

## Setup

1. Run the SQL migration in `supabase/001_initial_schema.sql` in your Supabase SQL editor.
2. Enable Google OAuth in Supabase Authentication settings.
3. Copy `.env.example` to `.env` and fill in your Supabase URL and anon key.
4. Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

## Super Admin bootstrap (Option A)

After your first Google sign-in, promote your account in the Supabase SQL editor:

```sql
update users set role = 'super_admin', is_active = true where email = 'your@email.com';
```

Then sign out and sign in again via the Super Admin card on the landing page.
