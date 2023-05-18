import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import payload from 'payload'

import { seed } from './seed'
const app = express()

// Redirect root to Admin panel
app.get('/', (_, res) => {
  res.redirect('/admin')
})

// Initialize Payload
const start = async (): Promise<void> => {
  await payload.initAsync({
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
