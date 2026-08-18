import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('[SupabaseAdmin] SUPABASE_URL:', supabaseUrl ? '✅' : '❌ MISSING')
  console.error('[SupabaseAdmin] SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? '✅' : '❌ MISSING')
}

export const supabaseAdmin = createClient(
  supabaseUrl || 'https://nrdxgunwmhqchvtedtqh.supabase.co',
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
