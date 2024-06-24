import type { Config } from 'payload'
import type { Payload } from 'payload'
import nodemailer from 'nodemailer'
import { jest } from '@jest/globals'

import { defaults } from 'payload'

import { payloadCloudEmail } from './email.js'

describe('email', () => {
  let defaultConfig: Config
  const skipVerify = true
  const defaultDomain = 'test.com'
  const apiKey = 'test'
  let createTransportSpy: jest.Spied<any>

  const mockedPayload: Payload = jest.fn() as unknown as Payload

  beforeEach(() => {
    defaultConfig = defaults as Config

    createTransportSpy = jest.spyOn(nodemailer, 'createTransport').mockImplementation(() => {
      return {
        verify: jest.fn(),
      } as unknown as ReturnType<typeof nodemailer.createTransport>
    })

    const createTestAccountSpy = jest.spyOn(nodemailer, 'createTestAccount').mockResolvedValue({
      pass: 'password',
      user: 'user',
      web: 'ethereal.email',
    } as unknown as nodemailer.TestAccount)
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
        skipVerify,
        defaultFromName,
        defaultFromAddress,
      })

      const initializedEmail = email({ payload: mockedPayload })

      expect(initializedEmail.defaultFromName).toEqual(defaultFromName)
      expect(initializedEmail.defaultFromAddress).toEqual(defaultFromAddress)
    })
  })
})
