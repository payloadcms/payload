import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { fallbackValuesSlug } from './shared.js'

test.suite('Field fallback values', { config: './config.ts' }, () => {
  for (const draft of [false, true]) {
    const operation = draft ? 'draft save' : 'published update'

    test(`should preserve omitted JSON tuples after a ${operation}`, async ({ payload }) => {
      const doc = await payload.create({
        collection: fallbackValuesSlug,
        data: {
          _status: draft ? 'draft' : 'published',
          json: [
            [100, 200],
            [300, 400],
          ],
          title: 'original',
        },
        draft,
      })

      await payload.update({
        id: doc.id,
        collection: fallbackValuesSlug,
        data: { title: 'updated' },
        draft,
      })

      const stored = await payload.findByID({
        id: doc.id,
        collection: fallbackValuesSlug,
        draft,
      })

      expect(stored.json).toStrictEqual([
        [100, 200],
        [300, 400],
      ])
    })

    test(`should preserve omitted protected nested fields after a ${operation}`, async ({
      payload,
    }) => {
      const doc = await payload.create({
        collection: fallbackValuesSlug,
        data: {
          _status: draft ? 'draft' : 'published',
          rows: [{ children: [{ code: 'stored' }] }],
          title: 'original',
        },
        draft,
      })

      await payload.update({
        id: doc.id,
        collection: fallbackValuesSlug,
        data: { title: 'updated' },
        draft,
        overrideAccess: false,
      })

      const stored = await payload.findByID({
        id: doc.id,
        collection: fallbackValuesSlug,
        draft,
      })

      expect(stored.rows?.[0]?.children?.[0]?.code).toBe('stored')
    })

    test(`should reject changes to protected nested fields during a ${operation}`, async ({
      payload,
    }) => {
      const doc = await payload.create({
        collection: fallbackValuesSlug,
        data: {
          _status: draft ? 'draft' : 'published',
          rows: [{ children: [{ code: 'stored' }] }],
        },
        draft,
      })

      const row = doc.rows![0]!

      await payload.update({
        id: doc.id,
        collection: fallbackValuesSlug,
        data: {
          rows: [{ id: row.id, children: [{ id: row.children![0]!.id, code: 'changed' }] }],
        },
        draft,
        overrideAccess: false,
      })

      const stored = await payload.findByID({
        id: doc.id,
        collection: fallbackValuesSlug,
        draft,
      })

      expect(stored.rows?.[0]?.children?.[0]?.code).toBe('stored')
    })
  }
})
