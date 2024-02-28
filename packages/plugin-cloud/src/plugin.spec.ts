import type { Config } from 'payload/config'

import nodemailer from 'nodemailer'
import { defaults } from 'payload/config'

import { payloadCloud } from './plugin'

describe('plugin', () => {
  describe('not in Payload Cloud', () => {
    // eslint-disable-next-line jest/expect-expect
    it('should return unmodified config, with webpack aliases', () => {
      const plugin = payloadCloud()
      const config = plugin(createConfig())

      assertNoCloudStorage(config)
      assertNoCloudEmail(config)
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
      it('should default to using payload cloud storage', () => {
        const plugin = payloadCloud()
        const config = plugin(createConfig())

        assertCloudStorage(config)
      })

      // eslint-disable-next-line jest/expect-expect
      it('should allow opt-out', () => {
        const plugin = payloadCloud({ storage: false })
        const config = plugin(createConfig())

        assertNoCloudStorage(config)
      })
    })

    describe('email', () => {
      // eslint-disable-next-line jest/expect-expect
      it('should default to using payload cloud email', () => {
        const plugin = payloadCloud()
        const config = plugin(createConfig())

        assertCloudEmail(config)
      })

      // eslint-disable-next-line jest/expect-expect
      it('should allow opt-out', () => {
        const plugin = payloadCloud({ email: false })
        const config = plugin(createConfig())

        assertNoCloudEmail(config)
      })

      // eslint-disable-next-line jest/expect-expect
      it('should allow PAYLOAD_CLOUD_EMAIL_* env vars to be unset', () => {
        delete process.env.PAYLOAD_CLOUD_EMAIL_API_KEY
        delete process.env.PAYLOAD_CLOUD_DEFAULT_DOMAIN

        const plugin = payloadCloud()
        const config = plugin(createConfig())

        assertNoCloudEmail(config)
      })

      it('should not modify existing email transport', () => {
        const existingTransport = nodemailer.createTransport({
          name: 'existing-transport',
          // eslint-disable-next-line @typescript-eslint/require-await
          send: async (mail) => {
            console.log('mock send', mail)
          },
          version: '0.0.1',
        })

        const configWithTransport = createConfig({
          email: {
            fromAddress: 'test@test.com',
            fromName: 'Test',
            transport: existingTransport,
          },
        })

        const plugin = payloadCloud()
        const config = plugin(configWithTransport)

        expect(
          config.email && 'transport' in config.email && config.email.transport?.transporter.name,
        ).toEqual('existing-transport')

        assertNoCloudEmail(config)
      })

      it('should allow setting fromName and fromAddress', () => {
        const configWithPartialEmail = createConfig({
          email: {
            fromAddress: 'test@test.com',
            fromName: 'Test',
          },
        })

        const plugin = payloadCloud()
        const config = plugin(configWithPartialEmail)

        expect(config.email?.fromName).toEqual(configWithPartialEmail.email?.fromName)
        expect(config.email?.fromAddress).toEqual(configWithPartialEmail.email?.fromAddress)

        assertCloudEmail(config)
      })
    })
  })
})

function assertCloudStorage(config: Config) {
  expect(config.admin).toHaveProperty('webpack')
  expect(config.upload?.useTempFiles).toEqual(true)
}

function assertNoCloudStorage(config: Config) {
  expect(config.admin).toHaveProperty('webpack')
  expect(config.upload?.useTempFiles).toBeFalsy()
}

function assertCloudEmail(config: Config) {
  expect(config.admin).toHaveProperty('webpack')
  if (config.email && 'transport' in config.email) {
    expect(config.email?.transport?.transporter.name).toEqual('SMTP')
  }
}

/** Asserts that plugin did not run (other than webpack aliases) */
function assertNoCloudEmail(config: Config) {
  expect(config.admin).toHaveProperty('webpack')

  // No transport set
  if (!config.email) return

  if ('transport' in config.email) {
    expect(config.email?.transport?.transporter.name).not.toEqual('SMTP')
  }
}

function createConfig(overrides?: Partial<Config>): Config {
  return {
    ...defaults,
    ...overrides,
  } as Config
}
