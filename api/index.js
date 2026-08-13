import express from 'express'
import cors from 'cors'
import { apiRouter } from './routes/index.js'

const app = express()

app.use(cors())

// On Vercel serverless, capture rawBody using express.raw() BEFORE express.json().
// This gives the webhook route the original bytes for HMAC-SHA256 verification.
app.use((req, res, next) => {
  express.raw({ type: '*/*', limit: '10mb' })(req, res, (err) => {
    if (err) return next(err)
    if (Buffer.isBuffer(req.body)) {
      req.rawBody = req.body.toString('utf8')
      // Re-parse as JSON for the rest of the routes
      try {
        req.body = JSON.parse(req.rawBody)
      } catch {
        req.body = {}
      }
    }
    next()
  })
})

app.use(express.json())

// Vercel strips the /api prefix before invoking this function,
// so mount routes at / (not /api)
app.use('/', apiRouter)

export default app
