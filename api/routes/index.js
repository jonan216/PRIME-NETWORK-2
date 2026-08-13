import { Router } from 'express'
import { marzRouter } from './marz.js'

const router = Router()

// Payment routes — frontend calls /api/marz/*
router.use('/marz', marzRouter)

// Webhook route — Marz Innovations posts to /api/webhooks/marz
// Route it to the same marzRouter so /webhook handler fires
router.use('/webhooks/marz', marzRouter)

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

export const apiRouter = router
