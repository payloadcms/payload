import type { Config } from 'payload/config'

import { defaults } from 'payload/config'

import { payloadCloudEmail } from './email'

describe('email', () => {
  let defaultConfig: Config

  beforeEach(() => {
    // @ts-expect-error No need for db or editor
    defaultConfig = { ...defaults }
  })

  describe('not in Payload Cloud', () => {
    it('should return undefined', () => {
      const email = payloadCloudEmail({
        apiKey: 'test',
        config: defaultConfig,
        defaultDomain: 'test',
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
        config: defaultConfig,
        defaultDomain: 'test',
      })
      expect(email?.fromName).toBeDefined()
      expect(email?.fromAddress).toBeDefined()
      expect(email?.transport?.transporter.name).toEqual('SMTP')
    })

    it('should allow setting fromName and fromAddress', () => {
      const fromName = 'custom from name'
      const fromAddress = 'custom@fromaddress.com'
      const configWithFrom: Config = {
        ...defaultConfig,
        email: {
          fromAddress,
          fromName,
        },
      }
      const email = payloadCloudEmail({
        apiKey: 'test',
        config: configWithFrom,
        defaultDomain: 'test',
      })

      expect(email?.fromName).toEqual(fromName)
      expect(email?.fromAddress).toEqual(fromAddress)
    })
  })
})
