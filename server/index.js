import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { apiRouter } from './routes/index.js'

dotenv.config()

const app = express()

app.use(cors())

// Capture rawBody BEFORE express.json() so the /webhook route can verify
// HMAC-SHA256 signatures over the exact bytes Marz Innovations sent.
app.use((req, _res, next) => {
  let data = ''
  req.on('data', chunk => { data += chunk })
  req.on('end', () => {
    req.rawBody = data
    next()
  })
})

app.use(express.json())

app.use('/api', apiRouter)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Prime Network backend running on port ${PORT}`)
})
