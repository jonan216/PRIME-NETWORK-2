import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { apiRouter } from './routes/index.js'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api', apiRouter)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Prime Network backend running on port ${PORT}`)
})
