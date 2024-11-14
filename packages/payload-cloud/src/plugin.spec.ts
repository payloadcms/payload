import type { Config, Payload } from 'payload'

import { jest } from '@jest/globals'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import nodemailer from 'nodemailer'
import { defaults } from 'payload'

import { payloadCloudPlugin } from './plugin.js'

const mockedPayload: Payload = jest.fn() as unknown as Payload

describe('plugin', () => {
  let createTransportSpy: jest.Spied<any>

  const skipVerify = true

  beforeEach(() => {
    createTransportSpy = jest.spyOn(nodemailer, 'createTransport').mockImplementationOnce(() => {
      return {
        transporter: {
          name: 'Nodemailer - SMTP',
        },
        verify: jest.fn(),
      } as unknown as ReturnType<typeof nodemailer.createTransport>
    })
  })

  describe('not in Payload Cloud', () => {
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
      it('should default to using payload cloud email', async () => {
        const plugin = payloadCloudPlugin()
        await plugin(createConfig())

        expect(createTransportSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            host: 'smtp.resend.com',
          }),
        )
      })

      it('should allow opt-out', async () => {
        const plugin = payloadCloudPlugin({ email: false })
        const config = await plugin(createConfig())

        expect(config.email).toBeUndefined()
      })

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
          // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-misused-promises
          send: async (mail) => {
            // eslint-disable-next-line no-console
            console.log('mock send', mail)
          },
          version: '0.0.1',
        })

        const configWithTransport = createConfig({
          email: await nodemailerAdapter({
            defaultFromAddress: 'test@test.com',
            defaultFromName: 'Test',
            skipVerify,
            transport: existingTransport,
          }),
        })

        const plugin = payloadCloudPlugin()
        await plugin(configWithTransport)

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

        expect(initializedEmail.defaultFromName).toStrictEqual(defaultFromName)
        expect(initializedEmail.defaultFromAddress).toStrictEqual(defaultFromAddress)

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
  expect(config.upload?.useTempFiles).toStrictEqual(true)
}

function assertNoCloudStorage(config: Config) {
  expect(config.upload?.useTempFiles).toBeFalsy()
}

function createConfig(overrides?: Partial<Config>): Config {
  return {
    ...defaults,
    ...overrides,
  } as Config
}
