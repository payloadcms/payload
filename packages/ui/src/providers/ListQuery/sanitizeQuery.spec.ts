import type { ListQuery } from 'payload'

import { describe, expect, it } from 'vitest'

import { sanitizeQuery } from './sanitizeQuery.js'

// `sanitizeQuery` receives URL-parsed input, where `columns` and `queryByGroup`
// arrive as JSON strings — wider than the `ListQuery` type. Cast in tests to model that.
const run = (query: Record<string, unknown>): ListQuery => sanitizeQuery(query as ListQuery)

/**
 * Regression coverage for https://github.com/payloadcms/payload/issues/16659
 *
 * `columns` and `queryByGroup` are written to the URL as JSON strings by the
 * ListQueryProvider (`JSON.stringify(...)`). When read back from the URL they
 * arrive as strings, so they must be parsed into their canonical array/object
 * form here — otherwise the next write re-stringifies an already-stringified
 * value, accumulating an escape layer on every refresh until the URL overflows
 * the request size limit (414 URI Too Long).
 */
describe('sanitizeQuery', () => {
  describe('columns (#16659)', () => {
    it('parses a JSON-stringified columns array from the URL back into an array', () => {
      const result = run({ columns: JSON.stringify(['id', '-slug', 'title']) })
      expect(result.columns).toEqual(['id', '-slug', 'title'])
    })

    it('leaves an already-parsed columns array untouched', () => {
      const result = run({ columns: ['id', '-slug'] })
      expect(result.columns).toEqual(['id', '-slug'])
    })

    it('does not accumulate escaping across repeated URL round-trips', () => {
      // Simulate the provider: each cycle reads from the URL (a JSON string) and
      // re-writes via JSON.stringify. With the fix this is a fixed point.
      const original = ['id', 'title']
      let urlValue = JSON.stringify(original)

      for (let i = 0; i < 10; i++) {
        const sanitized = run({ columns: urlValue })
        expect(sanitized.columns).toEqual(original)
        urlValue = JSON.stringify(sanitized.columns)
      }

      // The serialized URL value must remain a single-layer JSON array string.
      expect(urlValue).toBe(JSON.stringify(original))
    })

    it('recovers a multiply-encoded (already-corrupted) columns value back to an array', () => {
      // A URL corrupted by the pre-fix bug carries several JSON.stringify layers.
      let urlValue = JSON.stringify(['id', 'title'])
      urlValue = JSON.stringify(urlValue) // 2 layers
      urlValue = JSON.stringify(urlValue) // 3 layers
      expect(run({ columns: urlValue }).columns).toEqual(['id', 'title'])
    })

    it('still drops an empty columns array (stringified or not)', () => {
      expect(run({ columns: '[]' }).columns).toBeUndefined()
      expect(run({ columns: JSON.stringify('[]') }).columns).toBeUndefined()
      expect(run({ columns: [] }).columns).toBeUndefined()
    })
  })

  describe('queryByGroup (#16659)', () => {
    it('parses a JSON-stringified queryByGroup object from the URL back into an object', () => {
      const queryByGroup = { groupA: { page: 2 }, groupB: { sort: '-createdAt' } }
      const result = run({ queryByGroup: JSON.stringify(queryByGroup) })
      expect(result.queryByGroup).toEqual(queryByGroup)
    })

    it('does not accumulate escaping across repeated URL round-trips', () => {
      const original = { groupA: { page: 2 } }
      let urlValue = JSON.stringify(original)

      for (let i = 0; i < 10; i++) {
        const sanitized = run({ queryByGroup: urlValue })
        expect(sanitized.queryByGroup).toEqual(original)
        urlValue = JSON.stringify(sanitized.queryByGroup)
      }

      expect(urlValue).toBe(JSON.stringify(original))
    })
  })

  describe('existing sanitization behavior', () => {
    it('removes empty-string params', () => {
      expect(run({ preset: '' })).toEqual({})
    })

    it('coerces numeric limit/page strings', () => {
      const result = run({ limit: '25', page: '2' })
      expect(result.limit).toBe(25)
      expect(result.page).toBe(2)
    })

    it('drops an empty where object', () => {
      expect(run({ where: {} }).where).toBeUndefined()
    })
  })
})
