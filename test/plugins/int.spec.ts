import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { afterPluginSlug, pagesSlug } from './config.js'

let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Collections - Plugins', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    await payload.destroy()
  })

  it('created pages collection', async () => {
    const { id } = await payload.create({
      collection: pagesSlug,
      data: {
        title: 'Test Page',
      },
    })

    expect(id).toBeDefined()

    await payload.delete({ collection: pagesSlug, id })
  })

  describe('afterPlugins', () => {
    it('should create collection registered by afterPlugins callback', async () => {
      const { id } = await payload.create({
        collection: afterPluginSlug,
        data: {
          title: 'After Plugin Page',
        },
      })

      expect(id).toBeDefined()

      await payload.delete({ collection: afterPluginSlug, id })
    })

    it('should have access to the fully-assembled config from all plugins', () => {
      // The afterPlugins callback checks whether the pages collection exists
      // and sets discoveredPages accordingly
      const collection = payload.config.collections.find((c) => c.slug === afterPluginSlug)
      const discoveredField = collection?.fields.find(
        (f) => 'name' in f && f.name === 'discoveredPages',
      )

      expect(discoveredField).toBeDefined()
      expect('defaultValue' in discoveredField! && discoveredField.defaultValue).toBe(true)
    })
  })
})
