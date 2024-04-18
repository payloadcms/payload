import type { Payload } from 'payload'
import type { BlockField } from 'payload/types'

import { initPayloadInt } from '../helpers/initPayloadInt.js'
import configPromise from './config.js'

let payload: Payload

describe('Config', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(configPromise))
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  describe('payload config', () => {
    it('allows a custom field at the config root', () => {
      const { config } = payload
      expect(config.custom).toEqual({
        client: { name: 'Customer portal' },
        server: { name: 'Customer portal' },
      })
    })

    it('allows a custom field in the root endpoints', () => {
      const [endpoint] = payload.config.endpoints

      expect(endpoint.custom).toEqual({
        description: 'Get the sanitized payload config',
      })
    })
  })

  describe('collection config', () => {
    it('allows a custom field in collections', () => {
      const [collection] = payload.config.collections
      expect(collection.custom).toEqual({
        client: { externalLink: 'https://foo.bar' },
        server: { externalLink: 'https://foo.bar' },
      })
    })

    it('allows a custom field in collection endpoints', () => {
      const [collection] = payload.config.collections
      const [endpoint] = collection.endpoints || []

      expect(endpoint.custom).toEqual({
        examples: [{ type: 'response', value: { message: 'hi' } }],
      })
    })

    it('allows a custom field in collection fields', () => {
      const [collection] = payload.config.collections
      const [field] = collection.fields

      console.log({ custom: field.custom })

      expect(field.custom).toEqual({
        client: { description: 'The title of this page' },
        server: { description: 'The title of this page' },
      })
    })

    it('allows a custom field in blocks in collection fields', () => {
      const [collection] = payload.config.collections
      const [, blocksField] = collection.fields

      expect((blocksField as BlockField).blocks[0].custom).toEqual({
        server: { description: 'The blockOne of this page' },
        client: { description: 'The blockOne of this page' },
      })
    })
  })

  describe('global config', () => {
    it('allows a custom field in globals', () => {
      const [global] = payload.config.globals
      expect(global.custom).toEqual({ client: { foo: 'bar' }, server: { foo: 'bar' } })
    })

    it('allows a custom field in global endpoints', () => {
      const [global] = payload.config.globals
      const [endpoint] = global.endpoints || []

      expect(endpoint.custom).toEqual({ params: [{ in: 'query', name: 'name', type: 'string' }] })
    })

    it('allows a custom field in global fields', () => {
      const [global] = payload.config.globals
      const [field] = global.fields

      expect(field.custom).toEqual({
        client: { description: 'The title of my global' },
        server: { description: 'The title of my global' },
      })
    })
  })
})
