import 'dotenv/config'
import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nrdxgunwmhqchvtedtqh.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const MARZ_BASE_URL = process.env.MARZ_INNOVATIONS_BASE_URL || 'https://wallet.wearemarz.com/api/v1'
const MARZ_API_KEY = process.env.MARZ_INNOVATIONS_API_KEY || ''
const MARZ_API_SECRET = process.env.MARZ_INNOVATIONS_API_SECRET || ''

function getMarzAuthHeaders() {
  const credentials = Buffer.from(`${MARZ_API_KEY}:${MARZ_API_SECRET}`).toString('base64')
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json',
  }
}

const SUCCESS_STATUSES = ['completed', 'approved', 'credited', 'successful', 'success', 'paid', 'sandbox', 'settled', 'successful_payment']
const FAILED_STATUSES = ['failed', 'rejected', 'cancelled', 'expired']

async function probeMarzEndpoints() {
  console.log('📡 Testing Marz Innovations API Connection...')
  console.log('Base URL:', MARZ_BASE_URL)
  console.log('API Key:', MARZ_API_KEY ? MARZ_API_KEY.slice(0, 6) + '...' : 'MISSING')

  const endpoints = ['/transactions', '/payments', '/collect-money', '/wallet', '/balance', '/statement']

  for (const ep of endpoints) {
    try {
      const res = await axios.get(`${MARZ_BASE_URL}${ep}`, { headers: getMarzAuthHeaders() })
      console.log(`\n✅ Endpoint ${ep} returned status ${res.status}:`)
      console.log(JSON.stringify(res.data, null, 2).slice(0, 1000))
    } catch (err) {
      console.log(`❌ Endpoint ${ep} returned error: ${err.response?.status || err.message}`)
      if (err.response?.data) {
        console.log('   Details:', JSON.stringify(err.response.data))
      }
    }
  }
}

async function recoverAndSync() {
  await probeMarzEndpoints()

  console.log('\n==================================================')
  console.log('📋 Fetching all transactions in Supabase database...')
  const { data: dbTxs } = await supabase.from('transactions').select('*, profiles(email, full_name, username)')
  const { data: profiles } = await supabase.from('profiles').select('*')

  console.log(`Found ${dbTxs?.length || 0} existing transactions and ${profiles?.length || 0} user profiles.`)

  let recoveredCount = 0
  let totalRecoveredUGX = 0

  // Inspect any existing transactions in DB
  for (const tx of dbTxs || []) {
    if (tx.type === 'deposit' && tx.reference) {
      try {
        const res = await axios.get(`${MARZ_BASE_URL}/transactions/${encodeURIComponent(tx.reference)}`, {
          headers: getMarzAuthHeaders()
        })
        const status = String(res.data?.status || res.data?.data?.status || '').toLowerCase()
        const amount = parseFloat(res.data?.amount || res.data?.data?.amount || tx.amount || 0)

        console.log(`Checking ref ${tx.reference}: status = ${status}, amount = ${amount}`)

        if (SUCCESS_STATUSES.includes(status) && !['completed', 'approved'].includes(tx.status)) {
          console.log(`🎉 RECOVERED DEPOSIT: Crediting UGX ${amount} to user ${tx.user_id}`)
          await supabase.from('transactions').update({ status: 'completed', amount }).eq('id', tx.id)
          await supabase.rpc('increment_balance', { p_user_id: tx.user_id, p_amount: amount }).catch(() => {})
          recoveredCount++
          totalRecoveredUGX += amount
        }
      } catch (err) {
        console.log(`Ref check failed for ${tx.reference}: ${err.message}`)
      }
    }
  }

  // Recalculate system-wide balances
  console.log('\n🔄 Recalculating balances for all user accounts...')
  await supabase.rpc('recalculate_all_balances').catch(async () => {
    for (const p of profiles || []) {
      await supabase.rpc('recalculate_balance', { p_user_id: p.id }).catch(() => {})
    }
  })

  // Log summary
  const { data: updatedProfiles } = await supabase.from('profiles').select('id, email, username, balance')
  console.log('\n==================================================')
  console.log('✨ RECOVERY & BALANCE RECONCILIATION COMPLETE')
  console.log(`• Newly Recovered Deposits: ${recoveredCount}`)
  console.log(`• Total Amount Credited: UGX ${totalRecoveredUGX.toLocaleString()}`)
  console.log('\n📊 CURRENT USER BALANCES IN DATABASE:')
  for (const p of updatedProfiles || []) {
    console.log(`  - ${p.email || p.username || p.id}: Available Balance = UGX ${(p.balance || 0).toLocaleString()}`)
  }
  console.log('==================================================')
}

recoverAndSync()
