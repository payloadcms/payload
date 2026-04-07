import { describe, expect, it } from 'vitest'

import { joinPrefixes } from './joinPrefixes.js'

describe('joinPrefixes', () => {
  describe('basic joining', () => {
    it('should join two simple prefixes', () => {
      expect(joinPrefixes('base', 'collection')).toBe('base/collection')
    })

    it('should join multiple prefixes', () => {
      expect(joinPrefixes('a', 'b', 'c')).toBe('a/b/c')
    })

    it('should return single prefix unchanged', () => {
      expect(joinPrefixes('only')).toBe('only')
    })
  })

  describe('empty and undefined values', () => {
    it('should return empty string for no arguments', () => {
      expect(joinPrefixes()).toBe('')
    })

    it('should skip undefined values', () => {
      expect(joinPrefixes(undefined, 'valid')).toBe('valid')
      expect(joinPrefixes('valid', undefined)).toBe('valid')
      expect(joinPrefixes(undefined, 'a', undefined, 'b')).toBe('a/b')
    })

    it('should skip empty strings', () => {
      expect(joinPrefixes('', 'valid')).toBe('valid')
      expect(joinPrefixes('valid', '')).toBe('valid')
      expect(joinPrefixes('', 'a', '', 'b')).toBe('a/b')
    })

    it('should return empty string for all empty/undefined values', () => {
      expect(joinPrefixes(undefined, undefined)).toBe('')
      expect(joinPrefixes('', '')).toBe('')
      expect(joinPrefixes(undefined, '')).toBe('')
    })
  })

  describe('path normalization', () => {
    it('should remove trailing slashes', () => {
      expect(joinPrefixes('base/', 'collection')).toBe('base/collection')
      expect(joinPrefixes('base//', 'collection')).toBe('base/collection')
    })

    it('should remove leading slashes', () => {
      expect(joinPrefixes('/base', 'collection')).toBe('base/collection')
      expect(joinPrefixes('base', '/collection')).toBe('base/collection')
    })

    it('should handle multiple consecutive slashes', () => {
      expect(joinPrefixes('base///middle', 'collection')).toBe('base/middle/collection')
    })

    it('should convert backslashes to forward slashes', () => {
      expect(joinPrefixes('base\\sub', 'collection')).toBe('base/sub/collection')
      expect(joinPrefixes('base\\\\sub', 'collection')).toBe('base/sub/collection')
    })

    it('should normalize nested paths within a single prefix', () => {
      expect(joinPrefixes('base/nested/path', 'collection')).toBe('base/nested/path/collection')
    })
  })

  describe('path traversal protection', () => {
    it('should remove dot-dot segments', () => {
      expect(joinPrefixes('..', 'collection')).toBe('collection')
      expect(joinPrefixes('base/..', 'collection')).toBe('base/collection')
      expect(joinPrefixes('base/../other', 'collection')).toBe('base/other/collection')
    })

    it('should remove single dot segments', () => {
      expect(joinPrefixes('.', 'collection')).toBe('collection')
      expect(joinPrefixes('base/.', 'collection')).toBe('base/collection')
      expect(joinPrefixes('base/./sub', 'collection')).toBe('base/sub/collection')
    })

    it('should handle complex traversal attempts', () => {
      expect(joinPrefixes('../../etc/passwd', 'collection')).toBe('etc/passwd/collection')
      expect(joinPrefixes('base/../../other', 'collection')).toBe('base/other/collection')
    })
  })

  describe('real-world usage patterns', () => {
    it('should handle basePrefix + collection prefix', () => {
      expect(joinPrefixes('tenant-123', 'media')).toBe('tenant-123/media')
      expect(joinPrefixes('uploads/2024', 'images')).toBe('uploads/2024/images')
    })

    it('should handle undefined basePrefix with collection prefix', () => {
      expect(joinPrefixes(undefined, 'media/images')).toBe('media/images')
    })

    it('should handle basePrefix with undefined collection prefix', () => {
      expect(joinPrefixes('tenant-123', undefined)).toBe('tenant-123')
    })

    it('should handle dynamic prefix function results', () => {
      const dynamicPrefix = 'user-uploads/user-456'
      expect(joinPrefixes('app-data', dynamicPrefix)).toBe('app-data/user-uploads/user-456')
    })
  })
})
