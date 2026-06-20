import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill in your Supabase credentials.',
  )
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

export const SELECTED_ROLE_KEY = 'devCrew_selectedRole'

export const ROLE_DASHBOARDS = {
  super_admin: '/super-admin/dashboard',
  manager: '/manager/dashboard',
  developer: '/developer/dashboard',
}
