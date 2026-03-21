import { beforeEach, describe, expect, it } from 'vitest'
import { compressIdentifier } from './compressIdentifier.js'

describe('compressIdentifier', () => {
  let trackingSet: Set<string>

  beforeEach(() => {
    trackingSet = new Set()
  })

  describe('names already under the limit', () => {
    it('should return name + suffix unchanged', () => {
      const result = compressIdentifier({
        segments: ['users', 'email'],
        suffix: '_idx',
        maxLength: 63,
        trackingSet,
      })
      expect(result).toBe('users_email_idx')
    })
  })

  describe('vowel compression', () => {
    it('should remove interior vowels to fit under the limit', () => {
      // "categories_parent_order_idx" = 27 chars, needs compression at maxLength=25
      const result = compressIdentifier({
        segments: ['categories', 'parent_order'],
        suffix: '_idx',
        maxLength: 25,
        trackingSet,
      })
      expect(result.length).toBeLessThanOrEqual(25)
      expect(result).toMatch(/_idx$/)
      // Last segment "parent_order" and hash should be present
      expect(result).toMatch(/parent_order_[a-f0-9]{4}_idx$/)
    })

    it('should preserve the last segment (functional descriptor)', () => {
      const result = compressIdentifier({
        segments: ['very_long', 'collection_name', 'with_many_segments', 'parent_id'],
        suffix: '_fk',
        maxLength: 50,
        trackingSet,
      })
      expect(result).toMatch(/parent_id_[a-f0-9]{4}_fk$/)
      expect(result.length).toBeLessThanOrEqual(50)
    })
  })

  describe('hash fallback', () => {
    it('should fall back to hash when vowel compression is insufficient', () => {
      const result = compressIdentifier({
        segments: [
          'users',
          'v',
          'version',
          'ingredient',
          'sections',
          'section',
          'ingredients',
          'order',
        ],
        suffix: '_idx',
        maxLength: 40,
        trackingSet,
      })
      expect(result.length).toBeLessThanOrEqual(40)
      expect(result).toMatch(/_idx$/)
      // Should contain a 4-char hash
      expect(result).toMatch(/order_[a-f0-9]{4}_idx/)
    })

    it('should produce deterministic results for the same input', () => {
      const set1 = new Set<string>()
      const set2 = new Set<string>()
      const args = {
        segments: [
          'users',
          'v',
          'version',
          'ingredient',
          'sections',
          'section',
          'ingredients',
          'order',
        ],
        suffix: '_idx',
        maxLength: 40,
      }
      const r1 = compressIdentifier({ ...args, trackingSet: set1 })
      const r2 = compressIdentifier({ ...args, trackingSet: set2 })
      expect(r1).toBe(r2)
    })
  })

  describe('collision handling', () => {
    it('should not check trackingSet when fullName fits under maxLength', () => {
      const result1 = compressIdentifier({
        segments: ['users', 'email'],
        suffix: '_idx',
        maxLength: 63,
        trackingSet,
      })
      // Same call again — fullName fits, so returns same value without collision handling
      const result2 = compressIdentifier({
        segments: ['users', 'email'],
        suffix: '_idx',
        maxLength: 63,
        trackingSet,
      })
      expect(result1).toBe('users_email_idx')
      expect(result2).toBe('users_email_idx')
    })

    it('should throw on collision when compression produces a duplicate', () => {
      const args = {
        segments: [
          'users',
          'v',
          'version',
          'ingredient',
          'sections',
          'section',
          'ingredients',
          'order',
        ],
        suffix: '_idx',
        maxLength: 40,
        trackingSet,
      }
      compressIdentifier(args)
      expect(() => compressIdentifier(args)).toThrow(/Identifier collision/)
    })
  })

  describe('suffix types', () => {
    it('should work with _fk suffix', () => {
      const result = compressIdentifier({
        segments: ['users', 'rels', 'parent'],
        suffix: '_fk',
        maxLength: 63,
        trackingSet,
      })
      expect(result).toBe('users_rels_parent_fk')
    })

    it('should work with _unique suffix', () => {
      const result = compressIdentifier({
        segments: ['pages', 'locales', 'locale', 'parent_id'],
        suffix: '_unique',
        maxLength: 63,
        trackingSet,
      })
      expect(result).toBe('pages_locales_locale_parent_id_unique')
    })
  })

  describe('custom maxLength', () => {
    it('should respect a custom maxLength', () => {
      const result = compressIdentifier({
        segments: ['a', 'very', 'long', 'identifier', 'name', 'that', 'exceeds'],
        suffix: '_idx',
        maxLength: 30,
        trackingSet,
      })
      expect(result.length).toBeLessThanOrEqual(30)
      expect(result).toMatch(/_idx$/)
    })
  })

  describe('segment compression', () => {
    it('should remove interior vowels from segments', () => {
      // "ingredients" → "ingrdnts" (first "i" kept, interior vowels removed, last "s" kept)
      const result = compressIdentifier({
        segments: ['ineeeeeeets', 'order'],
        suffix: '_idx',
        maxLength: 20,
        trackingSet,
      })
      expect(result.length).toBeLessThanOrEqual(20)
      expect(result).toMatch(/order_[a-f0-9]{4}_idx$/)
      // Should not contain full "ingredients"
      expect(result).not.toContain('ingredients')
      // Should contain compressed form
      expect(result).toContain('ints')
    })

    it('should collapse double consonants after vowel removal', () => {
      // "settings" → remove interior vowels → "sttngs" → collapse "tt" → "stngs"
      const result = compressIdentifier({
        segments: ['settings', 'long', 'value'],
        suffix: '_idx',
        maxLength: 20,
        trackingSet,
      })
      expect(result.length).toBeLessThanOrEqual(20)
      expect(result).toMatch(/value_[a-f0-9]{4}_idx$/)
      expect(result).not.toContain('settings')
      expect(result).toContain('stngs')
    })

    it('should preserve underscores within segments', () => {
      // A segment like "parent_id" should have each sub-part compressed independently
      const result = compressIdentifier({
        segments: ['collection', 'parent_id'],
        suffix: '_fk',
        maxLength: 63,
        trackingSet,
      })
      expect(result).toBe('collection_parent_id_fk')
    })

    it('should stop compressing early when first segment is enough', () => {
      // fullName = "extraordinarily_aoob_order_idx" = 30 chars, force compression
      const result = compressIdentifier({
        segments: ['extraordinarily', 'aoob', 'order'],
        suffix: '_idx',
        maxLength: 29,
        trackingSet,
      })
      expect(result.length).toBeLessThanOrEqual(29)
      // "aoob" should remain uncompressed since compressing "extraordinarily" alone saves enough
      expect(result).not.toContain('extraordinarily')
      expect(result).toMatch(/aoob/)
    })
  })

  describe('error cases', () => {
    it('should throw when maxLength is too small for even the tail + hash + suffix', () => {
      expect(() =>
        compressIdentifier({
          segments: ['a', 'very_long_tail_segment'],
          suffix: '_idx',
          maxLength: 10,
          trackingSet,
        }),
      ).toThrow(/Unable to generate identifier/)
    })

    it('should strip trailing underscores when trimming compressed prefix', () => {
      // Craft a case where trimming lands right after an underscore
      const result = compressIdentifier({
        segments: ['abc_bcd', 'cde_efg', 'klm_opq', 'order'],
        suffix: '_idx',
        maxLength: 31,
        trackingSet,
      })
      expect(result.length).toBeLessThanOrEqual(30)
      // Should not have double underscores from trim
      expect(result).not.toMatch(/__/)
      expect(result).toMatch(/efg_order/)
    })
  })
})
