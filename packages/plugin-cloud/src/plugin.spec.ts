import type { Config } from 'payload/config'

import nodemailer from 'nodemailer'
import { defaults } from 'payload/config'

import { payloadCloud } from './plugin.js'
import { createNodemailerAdapter } from '@payloadcms/email-nodemailer'

describe('plugin', () => {
  let createTransportSpy: jest.SpyInstance

  const skipVerify = true

  beforeEach(() => {
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
    // eslint-disable-next-line jest/expect-expect
    it('should return unmodified config', async () => {
      const plugin = payloadCloud()
      const config = await plugin(createConfig())

      assertNoCloudStorage(config)
      expect(config.email).toBeUndefined()
    })
  })

  describe('in Payload Cloud', () => {
    beforeEach(() => {
      process.env.PAYLOAD_CLOUD = 'true'
      process.env.PAYLOAD_CLOUD_EMAIL_API_KEY = 'test-key'
      process.env.PAYLOAD_CLOUD_DEFAULT_DOMAIN = 'test-domain.com'
    })

    describe('storage', () => {
      // eslint-disable-next-line jest/expect-expect
      it('should default to using payload cloud storage', async () => {
        const plugin = payloadCloud()
        const config = await plugin(createConfig())

        assertCloudStorage(config)
      })

      // eslint-disable-next-line jest/expect-expect
      it('should allow opt-out', async () => {
        const plugin = payloadCloud({ storage: false })
        const config = await plugin(createConfig())

        assertNoCloudStorage(config)
      })
    })

    describe('email', () => {
      // eslint-disable-next-line jest/expect-expect
      it('should default to using payload cloud email', async () => {
        const plugin = payloadCloud()
        const config = await plugin(createConfig())

        assertCloudEmail(config)
      })

      // eslint-disable-next-line jest/expect-expect
      it('should allow opt-out', async () => {
        const plugin = payloadCloud({ email: false })
        const config = await plugin(createConfig())

        expect(config.email).toBeUndefined()
      })

      // eslint-disable-next-line jest/expect-expect
      it('should allow PAYLOAD_CLOUD_EMAIL_* env vars to be unset', async () => {
        delete process.env.PAYLOAD_CLOUD_EMAIL_API_KEY
        delete process.env.PAYLOAD_CLOUD_DEFAULT_DOMAIN

        const plugin = payloadCloud()
        const config = await plugin(createConfig())

        expect(config.email).toBeUndefined()
      })

      it('should not modify existing email transport', async () => {
        const logSpy = jest.spyOn(console, 'log')

        const existingTransport = nodemailer.createTransport({
          name: 'existing-transport',
          // eslint-disable-next-line @typescript-eslint/require-await
          send: async (mail) => {
            console.log('mock send', mail)
          },
          version: '0.0.1',
        })

        const configWithTransport = createConfig({
          email: await createNodemailerAdapter({
            defaultFromAddress: 'test@test.com',
            defaultFromName: 'Test',
            transport: existingTransport,
            skipVerify,
          }),
        })

        const plugin = payloadCloud()
        const config = await plugin(configWithTransport)

        expect(logSpy).toHaveBeenCalledWith(
          expect.stringContaining('Payload Cloud Email is enabled but'),
        )

        // expect(config.email).toBeUndefined()
      })

      it('should allow setting fromName and fromAddress', async () => {
        const defaultFromName = 'Test'
        const defaultFromAddress = 'test@test.com'
        const configWithPartialEmail = createConfig({
          email: await createNodemailerAdapter({
            defaultFromAddress,
            defaultFromName,
            skipVerify,
          }),
        })

        const plugin = payloadCloud()
        const config = await plugin(configWithPartialEmail)
        const emailConfig = config.email as Awaited<ReturnType<typeof createNodemailerAdapter>>

        expect(emailConfig.defaultFromName).toEqual(defaultFromName)
        expect(emailConfig.defaultFromAddress).toEqual(defaultFromAddress)

        assertCloudEmail(config)
      })
    })
  })
})

function assertCloudStorage(config: Config) {
  expect(config.upload?.useTempFiles).toEqual(true)
}

function assertNoCloudStorage(config: Config) {
  expect(config.upload?.useTempFiles).toBeFalsy()
}

function assertCloudEmail(config: Config) {
  expect(
    config.email && 'sendEmail' in config.email && typeof config.email.sendEmail === 'function',
  ).toBe(true)
}

function createConfig(overrides?: Partial<Config>): Config {
  return {
    ...defaults,
    ...overrides,
  } as Config
}
