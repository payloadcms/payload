import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import type { ReaderPluginOptions } from './config.js'

import { describe, suite, test } from '../__helpers/int/vitest.js'
import { pagesSlug } from './config.js'

suite('Collections - Plugins', { config: './config.ts' }, () => {
  test('created pages collection', async ({ payload }) => {
    const { id } = await payload.create({
      collection: pagesSlug,
      data: {
        title: 'Test Page',
      },
    })

    expect(id).toBeDefined()
  })

  describe('plugin order, slug, and options', () => {
    test('should execute plugins sorted by order regardless of array position', ({ payload }) => {
      // The reader (order 10) is listed BEFORE the writer (order 1) in the array,
      // but order sorting ensures the writer runs first.
      expect(payload.config.custom?.readerSawValue).toBe('written-by-low-priority')
    })

    test('should allow plugins to find each other by slug', ({ payload }) => {
      const reader = payload.config.plugins?.find((p) => p.slug === 'priority-reader')
      const writer = payload.config.plugins?.find((p) => p.slug === 'priority-writer')

      expect(reader).toBeDefined()
      expect(writer).toBeDefined()
    })

    test('should allow a plugin to mutate another plugin options via slug', ({ payload }) => {
      // The writer (runs first) finds the reader by slug and pushes into its options.items.
      // The reader (runs second) sees both the user-provided and injected items.
      const items = payload.config.custom?.readerItems as string[]

      expect(items).toContain('user-provided')
      expect(items).toContain('injected-by-writer')
    })

    test('should expose typed options on plugins found by slug', ({ payload }) => {
      const reader = payload.config.plugins?.find((p) => p.slug === 'priority-reader')

      expect(reader).toBeDefined()
      const items = reader!.options as ReaderPluginOptions
      expect(Array.isArray(items.items)).toBe(true)
      expect(items.items.length).toBeGreaterThan(0)
    })
  })
})
