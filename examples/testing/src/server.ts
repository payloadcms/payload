import path from 'path'
import express from 'express'
import payload from 'payload'

// Use `dotenv` to import your `.env` file automatically
require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
})

const app = express()

async function start() {
  await payload.init({
    secret: process.env.PAYLOAD_SECRET_KEY,
    express: app,
  })

  app.listen(process.env.PORT, async () => {
    console.log(`Express is now listening for incoming connections on port ${process.env.PORT}.`)
  })
}

start()
