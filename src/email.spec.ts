import { defaults } from 'payload/dist/config/defaults'

import { payloadCloudEmail } from './email'
import { Config } from 'payload/config'

describe('email', () => {
  let defaultConfig: Config
  beforeAll(() => {
    jest.mock('resend')
  })

  beforeEach(() => {
    defaultConfig = { ...defaults }
  })

  describe('not in Payload Cloud', () => {
    it('should return undefined', () => {
      const email = payloadCloudEmail({
        apiKey: 'test',
        defaultDomain: 'test',
        config: defaultConfig,
      })

      expect(email).toBeUndefined()
    })
  })

  describe('in Payload Cloud', () => {
    beforeEach(() => {
      process.env.PAYLOAD_CLOUD = 'true'
    })

    it('should respect PAYLOAD_CLOUD env var', () => {
      const email = payloadCloudEmail({
        apiKey: 'test',
        defaultDomain: 'test',
        config: defaultConfig,
      })
      expect(email?.fromName).toBeDefined()
      expect(email?.fromAddress).toBeDefined()
      expect(email?.transport?.transporter.name).toEqual('payload-cloud')
    })

    it('should allow setting fromName and fromAddress', () => {
      const fromName = 'custom from name'
      const fromAddress = 'custom@fromaddress.com'
      const configWithFrom: Config = {
        ...defaultConfig,
        email: {
          fromName,
          fromAddress,
        },
      }
      const email = payloadCloudEmail({
        config: configWithFrom,
        apiKey: 'test',
        defaultDomain: 'test',
      })

      expect(email?.fromName).toEqual(fromName)
      expect(email?.fromAddress).toEqual(fromAddress)
    })
  })
})
