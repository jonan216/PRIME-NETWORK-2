import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabaseAdmin.js'

export const adminRouter = Router()

const isAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) return res.status(401).json({ message: 'Missing authorization token' })

    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || ''
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return res.status(401).json({ message: 'Invalid token' })

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: admin access required' })
    }

    req.adminUser = user
    next()
  } catch (err) {
    console.error('Admin auth error:', err)
    return res.status(500).json({ message: 'Authentication failed' })
  }
}

adminRouter.use(isAdmin)

adminRouter.get('/users', async (_req, res) => {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .neq('role', 'admin')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return res.status(500).json({ message: 'Failed to fetch users', error: error.message })
    }

    const usersWithStats = await Promise.all(
      (users || []).map(async (u) => {
        const { data: txData } = await supabaseAdmin
          .from('transactions')
          .select('type, amount, status')
          .eq('user_id', u.id)

        const totalDeposits = txData?.filter(t => t.type === 'deposit' && t.status === 'completed').reduce((s, t) => s + (t.amount || 0), 0) || 0
        const totalWithdrawals = txData?.filter(t => t.type === 'withdrawal' && t.status === 'completed').reduce((s, t) => s + (t.amount || 0), 0) || 0
        const totalEarnings = txData?.filter(t => t.type === 'earning' && t.status === 'completed').reduce((s, t) => s + (t.amount || 0), 0) || 0
        const totalInvestments = txData?.filter(t => t.type === 'investment').reduce((s, t) => s + (t.amount || 0), 0) || 0

        const { data: invData } = await supabaseAdmin
          .from('investments')
          .select('amount, status')
          .eq('user_id', u.id)

        const activeInvestmentAmount = invData?.filter(i => i.status === 'active').reduce((s, i) => s + (i.amount || 0), 0) || 0

        return {
          ...u,
          totalDeposits,
          totalWithdrawals,
          totalEarnings,
          totalInvestments,
          activeInvestmentAmount,
          transactionCount: txData?.length || 0,
          investmentCount: invData?.length || 0,
        }
      })
    )

    res.json({ users: usersWithStats })
  } catch (err) {
    console.error('Admin users error:', err)
    res.status(500).json({ message: 'Failed to fetch users' })
  }
})

adminRouter.get('/transactions', async (req, res) => {
  try {
    const { type, status, userId } = req.query
    let query = supabaseAdmin
      .from('transactions')
      .select('*, profiles(full_name, email, username)')
      .order('created_at', { ascending: false })

    if (type) query = query.eq('type', type)
    if (status) query = query.eq('status', status)
    if (userId) query = query.eq('user_id', userId)

    const { data, error } = await query

    if (error) {
      console.error('Error fetching transactions:', error)
      return res.status(500).json({ message: 'Failed to fetch transactions', error: error.message })
    }

    res.json({ transactions: data || [] })
  } catch (err) {
    console.error('Admin transactions error:', err)
    res.status(500).json({ message: 'Failed to fetch transactions' })
  }
})

adminRouter.get('/investments', async (req, res) => {
  try {
    const { status, userId } = req.query
    let query = supabaseAdmin
      .from('investments')
      .select('*, profiles(full_name, email, username)')
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)
    if (userId) query = query.eq('user_id', userId)

    const { data, error } = await query

    if (error) {
      console.error('Error fetching investments:', error)
      return res.status(500).json({ message: 'Failed to fetch investments', error: error.message })
    }

    res.json({ investments: data || [] })
  } catch (err) {
    console.error('Admin investments error:', err)
    res.status(500).json({ message: 'Failed to fetch investments' })
  }
})

adminRouter.post('/users/:id/suspend', async (req, res) => {
  try {
    const { id } = req.params
    const { error } = await supabaseAdmin.from('profiles').update({ status: 'suspended' }).eq('id', id)
    if (error) {
      console.error('Error suspending user:', error)
      return res.status(500).json({ message: 'Failed to suspend user', error: error.message })
    }
    res.json({ message: 'User suspended successfully' })
  } catch (err) {
    console.error('Suspend user error:', err)
    res.status(500).json({ message: 'Failed to suspend user' })
  }
})

adminRouter.post('/users/:id/unsuspend', async (req, res) => {
  try {
    const { id } = req.params
    const { error } = await supabaseAdmin.from('profiles').update({ status: 'active' }).eq('id', id)
    if (error) {
      console.error('Error unsuspending user:', error)
      return res.status(500).json({ message: 'Failed to unsuspend user', error: error.message })
    }
    res.json({ message: 'User unsuspended successfully' })
  } catch (err) {
    console.error('Unuspend user error:', err)
    res.status(500).json({ message: 'Failed to unsuspend user' })
  }
})

adminRouter.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { error } = await supabaseAdmin.from('profiles').delete().eq('id', id)
    if (error) {
      console.error('Error deleting user:', error)
      return res.status(500).json({ message: 'Failed to delete user', error: error.message })
    }
    res.json({ message: 'User deleted successfully' })
  } catch (err) {
    console.error('Delete user error:', err)
    res.status(500).json({ message: 'Failed to delete user' })
  }
})

adminRouter.post('/investments/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body || {}

    const { data: investment, error: fetchError } = await supabaseAdmin
      .from('investments')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !investment) {
      return res.status(404).json({ message: 'Investment not found' })
    }

    if (investment.status !== 'active') {
      return res.status(400).json({ message: `Investment is already ${investment.status}` })
    }

    const { error: updateError } = await supabaseAdmin
      .from('investments')
      .update({ status: 'cancelled' })
      .eq('id', id)

    if (updateError) {
      console.error('Error cancelling investment:', updateError)
      return res.status(500).json({ message: 'Failed to cancel investment', error: updateError.message })
    }

    await supabaseAdmin.rpc('increment_balance', {
      p_user_id: investment.user_id,
      p_amount: investment.amount,
    }).catch(err => console.error('Refund balance error:', err))

    await supabaseAdmin.from('transactions').insert({
      user_id: investment.user_id,
      type: 'refund',
      amount: investment.amount,
      status: 'completed',
      provider: null,
      reference: `REFUND-${id}`,
    }).catch(err => console.error('Refund transaction error:', err))

    res.json({ message: 'Investment cancelled and balance refunded', investment })
  } catch (err) {
    console.error('Cancel investment error:', err)
    res.status(500).json({ message: 'Failed to cancel investment' })
  }
})

adminRouter.post('/transactions/:id/approve', async (req, res) => {
  try {
    const { id } = req.params
    const { data: tx, error: fetchError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !tx) {
      return res.status(404).json({ message: 'Transaction not found' })
    }

    if (tx.type === 'withdrawal') {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('balance')
        .eq('id', tx.user_id)
        .single()

      if (!profile || (profile.balance || 0) < (tx.amount || 0)) {
        return res.status(400).json({ message: 'Insufficient balance for withdrawal' })
      }

      await supabaseAdmin
        .from('profiles')
        .update({ balance: (profile.balance || 0) - (tx.amount || 0) })
        .eq('id', tx.user_id)
    } else if (tx.type === 'deposit') {
      if (tx.status !== 'completed' && tx.status !== 'approved') {
        await supabaseAdmin.rpc('increment_balance', { p_user_id: tx.user_id, p_amount: tx.amount || 0 }).catch(err => console.error('Approve deposit error:', err))
      }
    }

    const { error: updateError } = await supabaseAdmin
      .from('transactions')
      .update({ status: 'approved' })
      .eq('id', id)

    if (updateError) {
      console.error('Error approving transaction:', updateError)
      return res.status(500).json({ message: 'Failed to approve transaction', error: updateError.message })
    }

    res.json({ message: 'Transaction approved successfully' })
  } catch (err) {
    console.error('Approve transaction error:', err)
    res.status(500).json({ message: 'Failed to approve transaction' })
  }
})

adminRouter.post('/transactions/:id/reject', async (req, res) => {
  try {
    const { id } = req.params
    const { error } = await supabaseAdmin
      .from('transactions')
      .update({ status: 'rejected' })
      .eq('id', id)

    if (error) {
      console.error('Error rejecting transaction:', error)
      return res.status(500).json({ message: 'Failed to reject transaction', error: error.message })
    }

    res.json({ message: 'Transaction rejected successfully' })
  } catch (err) {
    console.error('Reject transaction error:', err)
    res.status(500).json({ message: 'Failed to reject transaction' })
  }
})

export const adminApiRouter = adminRouter
