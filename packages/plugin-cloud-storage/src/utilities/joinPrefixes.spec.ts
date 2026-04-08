import { describe, expect, it } from 'vitest'

import { joinPrefixes } from './joinPrefixes.js'

describe('joinPrefixes', () => {
  describe('basic joining', () => {
    it('should join multiple prefixes', () => {
      expect(joinPrefixes(['base', 'collection'])).toBe('base/collection')
    })

    it('should join three prefixes', () => {
      expect(joinPrefixes(['base', 'middle', 'end'])).toBe('base/middle/end')
    })

    it('should return single prefix', () => {
      expect(joinPrefixes(['only'])).toBe('only')
    })

    it('should return empty string for empty array', () => {
      expect(joinPrefixes([])).toBe('')
    })

    it('should skip empty/undefined items', () => {
      expect(joinPrefixes(['base', '', 'end'])).toBe('base/end')
      expect(joinPrefixes(['base', undefined as unknown as string, 'end'])).toBe('base/end')
      expect(joinPrefixes([{ prefix: '', sanitize: false }, 'end'])).toBe('end')
      expect(joinPrefixes([{ prefix: undefined, sanitize: false }, 'end'])).toBe('end')
    })
  })

  describe('string items are sanitized by default', () => {
    it('should remove path traversal', () => {
      expect(joinPrefixes(['../etc/passwd'])).toBe('etc/passwd')
      expect(joinPrefixes(['base', '../../etc'])).toBe('base/etc')
    })

    it('should remove dot segments', () => {
      expect(joinPrefixes(['./uploads'])).toBe('uploads')
      expect(joinPrefixes(['a/./b'])).toBe('a/b')
    })

    it('should normalize slashes', () => {
      expect(joinPrefixes(['a//b'])).toBe('a/b')
      expect(joinPrefixes(['a\\b'])).toBe('a/b')
    })

    it('should strip leading slashes', () => {
      expect(joinPrefixes(['/uploads'])).toBe('uploads')
    })

    it('should strip control characters', () => {
      expect(joinPrefixes(['user\x00input'])).toBe('userinput')
      expect(joinPrefixes(['path\x1fhere'])).toBe('pathhere')
    })
  })

  describe('object items with sanitize: false skip sanitization', () => {
    it('should preserve path traversal when sanitize is false', () => {
      expect(joinPrefixes([{ prefix: '../etc', sanitize: false }])).toBe('../etc')
    })

    it('should preserve leading slashes when sanitize is false', () => {
      expect(joinPrefixes([{ prefix: '/leading', sanitize: false }])).toBe('/leading')
    })

    it('should preserve trailing slashes when sanitize is false', () => {
      expect(joinPrefixes([{ prefix: 'base/', sanitize: false }])).toBe('base/')
    })

    it('should preserve double slashes when sanitize is false', () => {
      expect(joinPrefixes([{ prefix: 'a//b', sanitize: false }])).toBe('a//b')
    })
  })

  describe('object items with sanitize: true (or default) are sanitized', () => {
    it('should sanitize when sanitize is true', () => {
      expect(joinPrefixes([{ prefix: '../etc', sanitize: true }])).toBe('etc')
    })

    it('should sanitize when sanitize is omitted (defaults to true)', () => {
      expect(joinPrefixes([{ prefix: '../etc' }])).toBe('etc')
    })
  })

  describe('mixed items', () => {
    it('should handle trusted base + sanitized user prefix', () => {
      expect(joinPrefixes([{ prefix: 'my-project', sanitize: false }, '../../../etc/passwd'])).toBe(
        'my-project/etc/passwd',
      )
    })

    it('should handle multiple trusted prefixes + sanitized user prefix', () => {
      expect(
        joinPrefixes([
          { prefix: 'base', sanitize: false },
          { prefix: 'collection', sanitize: false },
          'user-input/../sneaky',
        ]),
      ).toBe('base/collection/user-input/sneaky')
    })

    it('should preserve trusted prefix structure while sanitizing user input', () => {
      expect(
        joinPrefixes([{ prefix: '/absolute/path/', sanitize: false }, '../../escape\x00attempt']),
      ).toBe('/absolute/path//escapeattempt')
    })
  })

  describe('real-world usage patterns', () => {
    it('should handle adapter prefix + document prefix', () => {
      expect(joinPrefixes([{ prefix: 'my-project', sanitize: false }, 'user-uploads'])).toBe(
        'my-project/user-uploads',
      )
    })

    it('should handle adapter prefix + collection prefix + document prefix', () => {
      expect(
        joinPrefixes([
          { prefix: 'my-project', sanitize: false },
          { prefix: 'media', sanitize: false },
          'tenant-123',
        ]),
      ).toBe('my-project/media/tenant-123')
    })

    it('should sanitize malicious user prefix while preserving trusted prefixes', () => {
      expect(
        joinPrefixes([{ prefix: 'safe/bucket', sanitize: false }, '../../etc/passwd\x00']),
      ).toBe('safe/bucket/etc/passwd')
    })

    it('should handle empty trusted prefix gracefully', () => {
      expect(joinPrefixes([{ prefix: '', sanitize: false }, 'uploads'])).toBe('uploads')
    })
  })
})
