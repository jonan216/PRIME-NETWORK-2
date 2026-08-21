import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = 'https://nrdxgunwmhqchvtedtqh.supabase.co'
const supabaseAnonKey = 'sb_publishable_-0WN0kVT8ek5rwtWOrFdBQ_uJISCx3o'

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function testRegistrationWithAnonKey() {
  const testEmail = `testuser_anon_${Date.now()}@example.com`
  const testUsername = `anon_${Date.now().toString().slice(-6)}`
  console.log(`Attempting anon registration: ${testEmail} / username: ${testUsername}`)

  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: 'TestPassword123!',
    options: {
      data: {
        full_name: 'Test Anon User',
        username: testUsername,
        referred_by: 'PRIME-A1B2C3' // testing with referral code
      }
    }
  })

  if (error) {
    console.error('❌ Registration failed with error:')
    console.error('Message:', error.message)
    console.error('Status:', error.status)
    console.error('Full Error:', JSON.stringify(error, null, 2))
  } else {
    console.log('✅ Registration succeeded! User ID:', data.user?.id)
    if (!data.session) {
      console.log('Note: Email confirmation might be enabled or user created without session.')
    }
  }
}

testRegistrationWithAnonKey()
