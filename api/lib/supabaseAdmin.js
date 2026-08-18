import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://nrdxgunwmhqchvtedtqh.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.warn('[SupabaseAdmin] Warning: Missing Supabase URL or key. Falling back to default configuration.')
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
