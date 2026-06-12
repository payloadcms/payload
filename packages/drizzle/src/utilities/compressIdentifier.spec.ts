import { beforeEach, describe, expect, it } from 'vitest'
import { compressIdentifier } from './compressIdentifier.js'

describe('compressIdentifier', () => {
  describe('names already under the limit', () => {
    it('should return name + suffix unchanged', () => {
      const result = compressIdentifier({
        segments: ['users', 'email'],
        suffix: '_idx',
        maxLength: 63,
      })
      expect(result).toBe('users_email_idx')
    })
  })

  describe('vowel compression', () => {
    it('should remove interior vowels to fit under the limit', () => {
      const result = compressIdentifier({
        segments: ['categories', 'parent_order'],
        suffix: '_idx',
        maxLength: 25,
      })
      expect(result.length).toBeLessThanOrEqual(25)
      expect(result).toMatch(/_idx$/)
      // Hash should be present
      expect(result).toMatch(/_[a-f0-9]{4}_idx$/)
    })

    it('should preserve the last segment when prefix compression is enough', () => {
      const result = compressIdentifier({
        segments: ['very_long', 'collection_name', 'with_many_segments', 'parent_id'],
        suffix: '_fk',
        maxLength: 50,
      })
      expect(result).toMatch(/_[a-f0-9]{4}_fk$/)
      expect(result.length).toBeLessThanOrEqual(50)
      // parent_id should be preserved since prefix compression should suffice
      expect(result).toContain('parent_id')
    })
  })

  describe('tail compression', () => {
    it('should compress the tail when prefix compression is insufficient', () => {
      const result = compressIdentifier({
        segments: ['very_long_tail_segment_that_is_really_quite_extensive'],
        suffix: '_idx',
        maxLength: 40,
      })
      expect(result.length).toBeLessThanOrEqual(40)
      expect(result).toMatch(/_[a-f0-9]{4}_idx$/)
    })

    it('should handle single-segment input that exceeds maxLength', () => {
      const result = compressIdentifier({
        segments: ['a_very_long_single_segment_name'],
        suffix: '_idx',
        maxLength: 30,
      })
      expect(result.length).toBeLessThanOrEqual(30)
      expect(result).toMatch(/_[a-f0-9]{4}_idx$/)
    })

    it('should compress tail after prefix is already fully compressed', () => {
      const result = compressIdentifier({
        segments: ['ab', 'cd', 'extremely_long_tail_identifier'],
        suffix: '_fk',
        maxLength: 35,
      })
      expect(result.length).toBeLessThanOrEqual(35)
      expect(result).toMatch(/_[a-f0-9]{4}_fk$/)
      // "ab" and "cd" are too short to compress, so tail must have been compressed
      expect(result).not.toContain('extremely_long_tail_identifier')
    })
  })

  describe('hash and determinism', () => {
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
      })
      expect(result.length).toBeLessThanOrEqual(40)
      expect(result).toMatch(/_idx$/)
      expect(result).toMatch(/_[a-f0-9]{4}_idx/)
    })

    it('should produce deterministic results for the same input', () => {
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
      const r1 = compressIdentifier({ ...args })
      const r2 = compressIdentifier({ ...args })
      expect(r1).toBe(r2)
    })
  })

  describe('suffix types', () => {
    it('should work with _fk suffix', () => {
      const result = compressIdentifier({
        segments: ['users', 'rels', 'parent'],
        suffix: '_fk',
        maxLength: 63,
      })
      expect(result).toBe('users_rels_parent_fk')
    })

    it('should work with _unique suffix', () => {
      const result = compressIdentifier({
        segments: ['pages', 'locales', 'locale', 'parent_id'],
        suffix: '_unique',
        maxLength: 63,
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
      })
      expect(result.length).toBeLessThanOrEqual(30)
      expect(result).toMatch(/_idx$/)
    })
  })

  describe('segment compression', () => {
    it('should remove interior vowels from segments', () => {
      const result = compressIdentifier({
        segments: ['ineeeeeeets', 'order'],
        suffix: '_idx',
        maxLength: 20,
      })
      expect(result.length).toBeLessThanOrEqual(20)
      expect(result).toMatch(/_[a-f0-9]{4}_idx$/)
      expect(result).not.toContain('ineeeeeeets')
      expect(result).toContain('ints')
    })

    it('should collapse double consonants after vowel removal', () => {
      const result = compressIdentifier({
        segments: ['settings', 'long', 'value'],
        suffix: '_idx',
        maxLength: 20,
      })
      expect(result.length).toBeLessThanOrEqual(20)
      expect(result).toMatch(/_[a-f0-9]{4}_idx$/)
      expect(result).not.toContain('settings')
      expect(result).toContain('stngs')
    })

    it('should preserve underscores within segments', () => {
      const result = compressIdentifier({
        segments: ['collection', 'parent_id'],
        suffix: '_fk',
        maxLength: 63,
      })
      expect(result).toBe('collection_parent_id_fk')
    })

    it('should stop compressing early when first segment is enough', () => {
      const result = compressIdentifier({
        segments: ['extraordinarily', 'aoob', 'order'],
        suffix: '_idx',
        maxLength: 29,
      })
      expect(result.length).toBeLessThanOrEqual(29)
      expect(result).not.toContain('extraordinarily')
      expect(result).toMatch(/aoob/)
    })
  })

  describe('error cases', () => {
    it('should throw when maxLength is too small for even hash + suffix', () => {
      // fullName = "abcdefghij_idx" = 14 chars > 8, triggers compression
      // hashSuffix = "_xxxx_idx" = 9 chars, budget = 8 - 9 = -1, impossible
      expect(() =>
        compressIdentifier({
          segments: ['abcdefghij'],
          suffix: '_idx',
          maxLength: 8,
        }),
      ).toThrow(/Unable to generate identifier/)
    })

    it('should strip trailing underscores when trimming compressed prefix', () => {
      const result = compressIdentifier({
        segments: ['abc_bcd', 'cde_efg', 'klm_opq', 'order'],
        suffix: '_idx',
        maxLength: 31,
      })
      expect(result.length).toBeLessThanOrEqual(31)
      // Should not have double underscores from trim
      expect(result).not.toMatch(/__/)
    })
  })
})
