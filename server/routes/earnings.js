import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabaseAdmin.js'

const router = Router()

router.post('/process', async (req, res) => {
  const isVercelCron = req.headers['x-vercel-cron'] === '1'
  const isDev = process.env.NODE_ENV !== 'production'

  if (!isVercelCron && !isDev) {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    const { error } = await supabaseAdmin.rpc('process_daily_earnings')

    if (error) {
      console.error('Daily earnings processing error:', error)
      return res.status(500).json({ message: 'Failed to process daily earnings', error: error.message })
    }

    return res.status(200).json({ message: 'Daily earnings processed successfully' })
  } catch (error) {
    console.error('Daily earnings processing error:', error)
    return res.status(500).json({ message: 'Failed to process daily earnings', error: error.message })
  }
})

export const earningsRouter = router
