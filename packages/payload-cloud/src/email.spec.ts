import type { Config, Payload } from 'payload'

import { jest } from '@jest/globals'
import nodemailer from 'nodemailer'
import { defaults } from 'payload'

import { payloadCloudEmail } from './email.js'

describe('email', () => {
  let defaultConfig: Config
  const skipVerify = true
  const defaultDomain = 'test.com'
  const apiKey = 'test'

  const mockedPayload: Payload = jest.fn() as unknown as Payload

  beforeAll(() => {
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
  })

  beforeEach(() => {
    defaultConfig = defaults as Config
  })

  describe('not in Payload Cloud', () => {
    it('should return undefined', async () => {
      const email = await payloadCloudEmail({
        apiKey,
        config: defaultConfig,
        defaultDomain,
        skipVerify,
      })

      expect(email).toBeUndefined()
    })
  })

  describe('in Payload Cloud', () => {
    beforeEach(() => {
      process.env.PAYLOAD_CLOUD = 'true'
    })

    it('should respect PAYLOAD_CLOUD env var', async () => {
      const email = await payloadCloudEmail({
        apiKey,
        config: defaultConfig,
        defaultDomain,
        skipVerify,
      })
      expect(email).toBeDefined()
    })

    it('should allow setting fromName and fromAddress', async () => {
      const defaultFromName = 'custom from name'
      const defaultFromAddress = 'custom@fromaddress.com'
      const configWithFrom: Config = {
        ...defaultConfig,
      }
      const email = await payloadCloudEmail({
        apiKey,
        config: configWithFrom,
        defaultDomain,
        defaultFromAddress,
        defaultFromName,
        skipVerify,
      })

      const initializedEmail = email({ payload: mockedPayload })

      expect(initializedEmail.defaultFromName).toStrictEqual(defaultFromName)
      expect(initializedEmail.defaultFromAddress).toStrictEqual(defaultFromAddress)
    })
  })
})
