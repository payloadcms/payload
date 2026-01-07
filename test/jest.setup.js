import { jest } from '@jest/globals'
import console from 'console'
global.console = console

import dotenv from 'dotenv'
dotenv.config()

import nodemailer from 'nodemailer'

import { generateDatabaseAdapter } from './generateDatabaseAdapter.js'

// Mock ESM-only packages that @payloadcms/figma imports but aren't needed for database adapter tests
// These are CLI/browser-specific dependencies that cause Jest transformation issues
jest.mock('open', () => ({
  default: jest.fn(),
}))

jest.mock('conf', () => ({
  default: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    has: jest.fn(),
    delete: jest.fn(),
  })),
}))

process.env.PAYLOAD_DATABASE = 'content-api'

// Content API authentication configuration
process.env.CONTENT_API_URL = process.env.CONTENT_API_URL || 'http://localhost:8080'
process.env.CONTENT_SYSTEM_ID =
  process.env.CONTENT_SYSTEM_ID || '00000000-0000-4000-8000-000000000001'
// JWT authentication will be used (no API key)

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
process.env.REDIS_URL = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379'

generateDatabaseAdapter(process.env.PAYLOAD_DATABASE)

// Note: Database clearing is handled by each adapter's init() function
// when PAYLOAD_DROP_DATABASE === 'true' (see postgres adapter's connect.ts for reference)
