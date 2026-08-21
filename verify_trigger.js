import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL || 'https://nrdxgunwmhqchvtedtqh.supabase.co'
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseServiceRoleKey) {
  console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing in env!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
})

async function runVerification() {
  console.log('--- STARTING TRANSACTION TRIGGER VERIFICATION ---')
  
  // 1. Pick a test user profile
  const { data: profiles, error: profileErr } = await supabase
    .from('profiles')
    .select('id, email, balance')
    .eq('role', 'user')
    .limit(1)

  if (profileErr || !profiles || profiles.length === 0) {
    console.error('Failed to retrieve a test profile:', profileErr?.message || 'No users found.')
    return
  }

  const testUser = profiles[0]
  console.log(`Using test profile: ID=${testUser.id}, Email=${testUser.email || 'N/A'}, Current Balance=${testUser.balance}`)

  // 2. Insert temporary deposit transaction with status='completed'
  const mockAmount = 25000
  const mockRef = `TEST-TRIG-${Date.now()}`
  console.log(`Inserting mock deposit transaction: Amount=${mockAmount}, Reference=${mockRef}`)

  const { data: newTx, error: insertErr } = await supabase
    .from('transactions')
    .insert({
      user_id: testUser.id,
      type: 'deposit',
      amount: mockAmount,
      status: 'completed',
      provider: 'marz_test',
      reference: mockRef
    })
    .select()
    .single()

  if (insertErr) {
    console.error('Failed to insert mock deposit transaction:', insertErr.message)
    return
  }

  console.log('Mock deposit inserted successfully! ID:', newTx.id)

  // 3. Wait 2 seconds for trigger processing, then retrieve the profile balance again
  console.log('Waiting 2 seconds for trigger to execute...')
  await new Promise(resolve => setTimeout(resolve, 2000))

  const { data: updatedProfile, error: fetchErr } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', testUser.id)
    .single()

  if (fetchErr) {
    console.error('Failed to query updated profile balance:', fetchErr.message)
  } else {
    console.log(`Updated Profile Balance matches: ${updatedProfile.balance}`)
    const expected = Number(testUser.balance) + mockAmount
    if (Number(updatedProfile.balance) === expected) {
      console.log('✅ SUCCESS: Trigger automatically executed and updated user balance on deposit insert!')
    } else {
      console.log(`❌ FAILURE: User balance is ${updatedProfile.balance}, but expected ${expected}. Trigger might not be deployed yet.`)
    }
  }

  // 4. Clean up mock transaction (deleting it will automatically trigger recalculation again)
  console.log('Cleaning up: Deleting mock deposit transaction...')
  const { error: deleteErr } = await supabase
    .from('transactions')
    .delete()
    .eq('id', newTx.id)

  if (deleteErr) {
    console.error('Cleanup failed to delete transaction:', deleteErr.message)
    return
  }
  console.log('Mock transaction successfully removed!')

  // Wait 2 seconds, then verify the balance is reverted
  await new Promise(resolve => setTimeout(resolve, 2000))
  const { data: revertedProfile } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', testUser.id)
    .single()

  if (revertedProfile) {
    console.log(`Reverted Profile Balance: ${revertedProfile.balance}`)
    if (Number(revertedProfile.balance) === Number(testUser.balance)) {
      console.log('✅ SUCCESS: Trigger automatically reverted profile balance on transaction delete!')
    } else {
      console.log('❌ FAILURE: Profile balance was not reverted correctly.')
    }
  }
}

runVerification()
