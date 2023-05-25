import express from 'express'
import path from 'path'
import payload from 'payload'
import email from './email/transport'

require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
})

const app = express()

app.get('/', (_, res) => {
  res.redirect('/admin')
})

const start = async (): Promise<void> => {
  await payload.init({
    secret: process.env.PAYLOAD_SECRET,
    mongoURL: process.env.MONGODB_URI,
    express: app,
    email,
    onInit: () => {
      payload.logger.info(`Payload Admin URL: ${payload.getAdminURL()}`)
    },
  })

  app.listen(8000)
}

start()
