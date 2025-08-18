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
