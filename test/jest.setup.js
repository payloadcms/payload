import { jest } from '@jest/globals'
import console from 'console'
global.console = console

import dotenv from 'dotenv'
dotenv.config()

import nodemailer from 'nodemailer'

import { generateDatabaseAdapter } from './generateDatabaseAdapter.js'

process.env.PAYLOAD_DISABLE_ADMIN = 'true'
process.env.PAYLOAD_DROP_DATABASE = 'true'

process.env.PAYLOAD_PUBLIC_CLOUD_STORAGE_ADAPTER = 's3'

process.env.NODE_OPTIONS = '--no-deprecation'
process.env.PAYLOAD_CI_DEPENDENCY_CHECKER = 'true'
// @todo remove in 4.0 - will behave like this by default in 4.0
process.env.PAYLOAD_DO_NOT_SANITIZE_LOCALIZED_PROPERTY = 'true'

// process.env.PAYLOAD_DATABASE = 'content-api'
process.env.PAYLOAD_DATABASE = 'content-api-jsonb'

// Mock createTestAccount to prevent calling external services
jest.spyOn(nodemailer, 'createTestAccount').mockImplementation(() => {
  return Promise.resolve({
    imap: { host: 'imap.test.com', port: 993, secure: true },
    pass: 'testpass',
    pop3: { host: 'pop3.test.com', port: 995, secure: true },
    smtp: { host: 'smtp.test.com', port: 587, secure: false },
    user: 'testuser',
    web: 'https://webmail.test.com',
  })
})

if (!process.env.PAYLOAD_DATABASE) {
  // Mutate env so we can use conditions by DB adapter in tests properly without ignoring // eslint no-jest-conditions.
  process.env.PAYLOAD_DATABASE = 'mongodb'
}

generateDatabaseAdapter(process.env.PAYLOAD_DATABASE)

// Clear database tables based on the database adapter
async function clearDatabase() {
  const database = process.env.PAYLOAD_DATABASE

  if (database === 'content-api') {
    try {
      await fetch('http://localhost:8000/clear-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      console.log('Cleared content-api database tables')
    } catch (error) {
      console.warn('Failed to clear content-api database:', error.message)
    }
  } else if (database === 'content-api-jsonb') {
    try {
      await fetch('http://localhost:8001/clear-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      console.log('Cleared content-api-jsonb database tables')
    } catch (error) {
      console.warn('Failed to clear content-api-jsonb database:', error.message)
    }
  }
}

// Run database clearing
clearDatabase()
