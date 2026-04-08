import { describe, expect, it } from 'vitest'

import { joinPrefixes } from './joinPrefixes.js'

describe('joinPrefixes', () => {
  describe('basic joining', () => {
    it('should join basePrefix and prefix', () => {
      expect(joinPrefixes({ basePrefix: 'base', prefix: 'collection' })).toBe('base/collection')
    })

    it('should return basePrefix only when no prefix', () => {
      expect(joinPrefixes({ basePrefix: 'base' })).toBe('base')
      expect(joinPrefixes({ basePrefix: 'base', prefix: undefined })).toBe('base')
      expect(joinPrefixes({ basePrefix: 'base', prefix: '' })).toBe('base')
    })

    it('should return prefix only when no basePrefix', () => {
      expect(joinPrefixes({ prefix: 'collection' })).toBe('collection')
      expect(joinPrefixes({ basePrefix: undefined, prefix: 'collection' })).toBe('collection')
      expect(joinPrefixes({ basePrefix: '', prefix: 'collection' })).toBe('collection')
    })

    it('should return empty string when both are empty/undefined', () => {
      expect(joinPrefixes({})).toBe('')
      expect(joinPrefixes({ basePrefix: undefined, prefix: undefined })).toBe('')
      expect(joinPrefixes({ basePrefix: '', prefix: '' })).toBe('')
    })
  })

  describe('basePrefix is not sanitized (config-controlled)', () => {
    it('should preserve basePrefix as-is', () => {
      expect(joinPrefixes({ basePrefix: 'my-project/env', prefix: 'uploads' })).toBe(
        'my-project/env/uploads',
      )
    })

    it('should not strip leading slashes from basePrefix', () => {
      expect(joinPrefixes({ basePrefix: '/leading', prefix: 'uploads' })).toBe('/leading/uploads')
    })

    it('should preserve trailing slashes in basePrefix', () => {
      expect(joinPrefixes({ basePrefix: 'base/', prefix: 'uploads' })).toBe('base//uploads')
    })
  })

  describe('prefix is sanitized (user-controlled)', () => {
    it('should remove path traversal from prefix', () => {
      expect(joinPrefixes({ basePrefix: 'base', prefix: '../etc/passwd' })).toBe('base/etc/passwd')
      expect(joinPrefixes({ basePrefix: 'base', prefix: '../../etc' })).toBe('base/etc')
    })

    it('should remove dot segments from prefix', () => {
      expect(joinPrefixes({ basePrefix: 'base', prefix: './uploads' })).toBe('base/uploads')
      expect(joinPrefixes({ basePrefix: 'base', prefix: 'a/./b' })).toBe('base/a/b')
    })

    it('should normalize slashes in prefix', () => {
      expect(joinPrefixes({ basePrefix: 'base', prefix: 'a//b' })).toBe('base/a/b')
      expect(joinPrefixes({ basePrefix: 'base', prefix: 'a\\b' })).toBe('base/a/b')
    })

    it('should strip leading slashes from prefix', () => {
      expect(joinPrefixes({ basePrefix: 'base', prefix: '/uploads' })).toBe('base/uploads')
    })

    it('should strip control characters from prefix', () => {
      expect(joinPrefixes({ basePrefix: 'base', prefix: 'user\x00input' })).toBe('base/userinput')
      expect(joinPrefixes({ basePrefix: 'base', prefix: 'path\x1fhere' })).toBe('base/pathhere')
      expect(joinPrefixes({ basePrefix: 'base', prefix: 'test\x80\x9f' })).toBe('base/test')
    })
  })

  describe('real-world usage patterns', () => {
    it('should handle tenant + media prefix', () => {
      expect(joinPrefixes({ basePrefix: 'tenant-123', prefix: 'media' })).toBe('tenant-123/media')
    })

    it('should handle environment-based basePrefix', () => {
      expect(joinPrefixes({ basePrefix: 'prod/uploads', prefix: 'images' })).toBe(
        'prod/uploads/images',
      )
    })

    it('should handle user-provided dynamic prefix', () => {
      const userPrefix = 'user-uploads/user-456'
      expect(joinPrefixes({ basePrefix: 'app-data', prefix: userPrefix })).toBe(
        'app-data/user-uploads/user-456',
      )
    })

    it('should sanitize malicious user prefix', () => {
      const maliciousPrefix = '../../etc/passwd\x00'
      expect(joinPrefixes({ basePrefix: 'safe', prefix: maliciousPrefix })).toBe('safe/etc/passwd')
    })
  })
})
