import { resolve } from 'path'
import payload from 'payload'
import express from 'express'
import testCredentials from './credentials'

require('dotenv').config({
  path: resolve(__dirname, '../../.env'),
})

const app = express()

const globalSetup = async () => {
  await payload.init({
    secret: process.env.PAYLOAD_SECRET_KEY,
    express: app,
  })

  app.listen(process.env.PORT, async () => {
    console.log(`Express is now listening for incoming connections on port ${process.env.PORT}.`)
  })

  const response = await fetch(
    `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/users/first-register`,
    {
      body: JSON.stringify({
        email: testCredentials.email,
        password: testCredentials.password,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'post',
    },
  )

  const data = await response.json()

  if (!data.user || !data.user.token) {
    throw new Error('Failed to register first user')
  }
}

export default globalSetup
