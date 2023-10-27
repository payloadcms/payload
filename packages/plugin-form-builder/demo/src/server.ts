import dotenv from 'dotenv'
import express from 'express'
import payload from 'payload'

import { seed } from './seed'

dotenv.config()
const app = express()

// Redirect root to Admin panel
app.get('/', (_, res) => {
  res.redirect('/admin')
})

// Initialize Payload
const start = async (): Promise<any> => {
  await payload.init({
    secret: process.env.PAYLOAD_SECRET,
    mongoURL: process.env.MONGODB_URI,
    express: app,
    onInit: () => {
      payload.logger.info(`Payload Admin URL: ${payload.getAdminURL()}`)
    },
  })

  if (process.env.PAYLOAD_SEED === 'true') {
    await seed(payload)
  }

  app.listen(3000)
}

start()
