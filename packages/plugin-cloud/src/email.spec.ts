import type { Config, Payload } from 'payload'

import { jest } from '@jest/globals'
import { defaults } from 'payload'

import { payloadCloudEmail } from './email.js'

describe('email', () => {
  let defaultConfig: Config
  const skipVerify = true
  const defaultDomain = 'test.com'
  const apiKey = 'test'

  const mockedPayload: Payload = jest.fn() as unknown as Payload

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
