import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env.local file.')
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'x-application-name': 'prime-network',
    },
  },
})

export function mapSupabaseError(error: { message?: string; details?: string; hint?: string; code?: string } | null): string {
  if (!error) return 'Unknown error'
  if (error.code === '42P17') return 'Database policy error. Please contact support.'
  if (error.code === '23505') return 'This record already exists.'
  if (error.code === 'PGRST301') return 'Not authorized to perform this action.'
  return error.message || error.details || 'Database operation failed'
}
