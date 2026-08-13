import { Router } from 'express'
import { marzRouter } from './marz.js'

const router = Router()

router.use('/webhooks/marz', marzRouter)
router.use('/marz', marzRouter)

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

export const apiRouter = router
