import type { Config, Payload } from 'payload'

import { jest } from '@jest/globals'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import nodemailer from 'nodemailer'
import { defaults } from 'payload'

// TO-DO: this would be needed for the TO-DO tests below.
// maybe we have to use jest.unstable_mockModule? (already tried)
// jest.mock('./plugin.ts', () => ({
//   // generateRandomString: jest.fn<() => string>().mockReturnValue('instance'),
//   generateRandomString: jest.fn().mockReturnValue('instance'),
// }))

const mockedPayload: Payload = {
  updateGlobal: jest.fn(),
  findGlobal: jest.fn().mockReturnValue('instance'),
} as unknown as Payload

import { payloadCloudPlugin } from './plugin.js'

describe('plugin', () => {
  let createTransportSpy: jest.Spied<any>

  const skipVerify = true

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
          // eslint-disable-next-line @typescript-eslint/require-await
          verify: async (): Promise<true> => true,
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

  describe('autoRun and cronJobs', () => {
    beforeEach(() => {
      process.env.PAYLOAD_CLOUD = 'true'
      process.env.PAYLOAD_CLOUD_EMAIL_API_KEY = 'test-key'
      process.env.PAYLOAD_CLOUD_DEFAULT_DOMAIN = 'test-domain.com'
    })

    test('should always set global instance identifier', async () => {
      const plugin = payloadCloudPlugin()
      const config = await plugin(createConfig())

      const globalInstance = config.globals?.find(
        (global) => global.slug === 'payload-cloud-instance',
      )

      expect(globalInstance).toBeDefined()
      expect(globalInstance?.fields).toStrictEqual([
        {
          name: 'instance',
          type: 'text',
          required: true,
        },
      ]),
        expect(globalInstance?.admin?.hidden).toStrictEqual(true)
    })
    // TO-DO: I managed to mock findGlobal, but not generateRandomString
    test.skip('if autoRun is not set, should return default cron job', async () => {
      const plugin = payloadCloudPlugin()
      const config = await plugin(createConfig())
      const DEFAULT_CRON_JOB = {
        cron: '* * * * *',
        limit: 10,
        queue: 'default (every minute)',
      }
      if (typeof config.jobs?.autoRun !== 'function') {
        throw new Error('autoRun should be a function')
      }
      const cronConfig = await config.jobs!.autoRun!(mockedPayload)
      expect(cronConfig).toStrictEqual([DEFAULT_CRON_JOB])
    })
    // TO-DO: I managed to mock findGlobal, but not generateRandomString
    // Either way when mocking the plugin part this test has little if any importance
    test.skip('if autoRun is a function, should return the result of the function', async () => {
      const plugin = payloadCloudPlugin()
      const config = await plugin(
        createConfig({
          jobs: {
            tasks: [],
            autoRun: async () => {
              return [
                {
                  cron: '1 2 3 4 5',
                  limit: 5,
                  queue: 'test-queue',
                },
                {},
              ]
            },
          },
        }),
      )
      expect(config.jobs?.autoRun).toStrictEqual([
        {
          cron: '1 2 3 4 5',
          limit: 5,
          queue: 'test-queue',
        },
        {},
      ])
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
