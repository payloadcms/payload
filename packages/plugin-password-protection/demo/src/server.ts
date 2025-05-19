import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import payload from 'payload'

const app = express()

// Redirect root to Admin panel
app.get('/', (_, res) => {
  res.redirect('/admin')
})

// Initialize Payload
const start = async (): Promise<void> => {
  await payload.init({
    secret: process.env.PAYLOAD_SECRET,
    mongoURL: process.env.MONGODB_URI,
    express: app,
    onInit: () => {
      payload.logger.info(`Payload Admin URL: ${payload.getAdminURL()}`)
    },
  })

  app.listen(3000)
}

start()
