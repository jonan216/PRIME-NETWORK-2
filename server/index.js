import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { apiRouter } from './routes/index.js'

const app = express()

app.use(cors())

// On server, capture rawBody using express.raw() BEFORE parsing JSON.
// This gives the webhook route the original bytes for HMAC-SHA256 verification.
app.use((req, res, next) => {
  express.raw({ type: '*/*', limit: '10mb' })(req, res, (err) => {
    if (err) return next(err)
    if (Buffer.isBuffer(req.body)) {
      req.rawBody = req.body.toString('utf8')
      try {
        req.body = JSON.parse(req.rawBody)
      } catch {
        req.body = {}
      }
    }
    next()
  })
})

app.use('/api', apiRouter)

const PORT = process.argv[2] || process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Prime Network backend running on port ${PORT}`)
})
