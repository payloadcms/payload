import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { ReaderPluginOptions } from './config.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { pagesSlug } from './config.js'

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
  })

  describe('plugin order, slug, and options', () => {
    it('should execute plugins sorted by order regardless of array position', () => {
      // The reader (order 10) is listed BEFORE the writer (order 1) in the array,
      // but order sorting ensures the writer runs first.
      expect(payload.config.custom?.readerSawValue).toBe('written-by-low-priority')
    })

    it('should allow plugins to find each other by slug', () => {
      const reader = payload.config.plugins?.find((p) => p.slug === 'priority-reader')
      const writer = payload.config.plugins?.find((p) => p.slug === 'priority-writer')

      expect(reader).toBeDefined()
      expect(writer).toBeDefined()
    })

    it('should allow a plugin to mutate another plugin options via slug', () => {
      // The writer (runs first) finds the reader by slug and pushes into its options.items.
      // The reader (runs second) sees both the user-provided and injected items.
      const items = payload.config.custom?.readerItems as string[]

      expect(items).toContain('user-provided')
      expect(items).toContain('injected-by-writer')
    })

    it('should expose typed options on plugins found by slug', () => {
      const reader = payload.config.plugins?.find((p) => p.slug === 'priority-reader')

      expect(reader).toBeDefined()
      const items = reader!.options as ReaderPluginOptions
      expect(Array.isArray(items.items)).toBe(true)
      expect(items.items.length).toBeGreaterThan(0)
    })
  })
})
