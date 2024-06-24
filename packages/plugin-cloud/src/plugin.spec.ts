import type { Config } from 'payload'
import type { Payload } from 'payload'
import { jest } from '@jest/globals'

import nodemailer from 'nodemailer'
import { defaults } from 'payload'

import { payloadCloudPlugin } from './plugin.js'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'

const mockedPayload: Payload = jest.fn() as unknown as Payload

describe('plugin', () => {
  let createTransportSpy: jest.Spied<any>

  const skipVerify = true

  beforeEach(() => {
    createTransportSpy = jest.spyOn(nodemailer, 'createTransport').mockImplementationOnce(() => {
      return {
        verify: jest.fn(),
        transporter: {
          name: 'Nodemailer - SMTP',
        },
      } as unknown as ReturnType<typeof nodemailer.createTransport>
    })

    const createTestAccountSpy = jest.spyOn(nodemailer, 'createTestAccount').mockResolvedValueOnce({
      pass: 'password',
      user: 'user',
      web: 'ethereal.email',
    } as unknown as nodemailer.TestAccount)
  })

  describe('not in Payload Cloud', () => {
    // eslint-disable-next-line jest/expect-expect
    it('should return unmodified config', async () => {
      const plugin = payloadCloudPlugin()
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
        const plugin = payloadCloudPlugin()
        const config = await plugin(createConfig())

        assertCloudStorage(config)
      })

      // eslint-disable-next-line jest/expect-expect
      it('should allow opt-out', async () => {
        const plugin = payloadCloudPlugin({ storage: false })
        const config = await plugin(createConfig())

        assertNoCloudStorage(config)
      })
    })

    describe('email', () => {
      // eslint-disable-next-line jest/expect-expect
      it('should default to using payload cloud email', async () => {
        const plugin = payloadCloudPlugin()
        const config = await plugin(createConfig())

        expect(createTransportSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            host: 'smtp.resend.com',
          }),
        )
      })

      // eslint-disable-next-line jest/expect-expect
      it('should allow opt-out', async () => {
        const plugin = payloadCloudPlugin({ email: false })
        const config = await plugin(createConfig())

        expect(config.email).toBeUndefined()
      })

      // eslint-disable-next-line jest/expect-expect
      it('should allow PAYLOAD_CLOUD_EMAIL_* env vars to be unset', async () => {
        delete process.env.PAYLOAD_CLOUD_EMAIL_API_KEY
        delete process.env.PAYLOAD_CLOUD_DEFAULT_DOMAIN

        const plugin = payloadCloudPlugin()
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
          email: await nodemailerAdapter({
            defaultFromAddress: 'test@test.com',
            defaultFromName: 'Test',
            transport: existingTransport,
            skipVerify,
          }),
        })

        const plugin = payloadCloudPlugin()
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
          email: await nodemailerAdapter({
            defaultFromAddress,
            defaultFromName,
            skipVerify,
          }),
        })

        const plugin = payloadCloudPlugin()
        const config = await plugin(configWithPartialEmail)
        const emailConfig = config.email as Awaited<ReturnType<typeof nodemailerAdapter>>

        const initializedEmail = emailConfig({ payload: mockedPayload })

        expect(initializedEmail.defaultFromName).toEqual(defaultFromName)
        expect(initializedEmail.defaultFromAddress).toEqual(defaultFromAddress)

        expect(createTransportSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            host: 'smtp.resend.com',
          }),
        )
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

async function assertCloudEmail(config: Config) {
  expect(config.email && 'name' in config.email).toStrictEqual('Nodemailer - SMTP')
}

function createConfig(overrides?: Partial<Config>): Config {
  return {
    ...defaults,
    ...overrides,
  } as Config
}
