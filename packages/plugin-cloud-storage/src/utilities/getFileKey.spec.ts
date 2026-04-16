import { getFileKey } from './getFileKey.js'
import { describe, expect, it } from 'vitest'

describe('getFileKey', () => {
  describe('non-composite mode (useCompositePrefixes: false)', () => {
    it('should use docPrefix when provided, ignoring collectionPrefix', () => {
      const result = getFileKey({
        collectionPrefix: 'collection',
        docPrefix: 'document',
        filename: 'test.png',
        useCompositePrefixes: false,
      })
      expect(result).toBe('document/test.png')
    })

    it('should fallback to collectionPrefix when docPrefix is empty', () => {
      const result = getFileKey({
        collectionPrefix: 'collection',
        docPrefix: '',
        filename: 'test.png',
        useCompositePrefixes: false,
      })
      expect(result).toBe('collection/test.png')
    })

    it('should fallback to collectionPrefix when docPrefix is undefined', () => {
      const result = getFileKey({
        collectionPrefix: 'collection',
        filename: 'test.png',
        useCompositePrefixes: false,
      })
      expect(result).toBe('collection/test.png')
    })

    it('should return only filename when both prefixes are empty', () => {
      const result = getFileKey({
        filename: 'test.png',
        useCompositePrefixes: false,
      })
      expect(result).toBe('test.png')
    })
  })

  describe('composite mode (useCompositePrefixes: true)', () => {
    it('should combine collectionPrefix and docPrefix', () => {
      const result = getFileKey({
        collectionPrefix: 'collection',
        docPrefix: 'document',
        filename: 'test.png',
        useCompositePrefixes: true,
      })
      expect(result).toBe('collection/document/test.png')
    })

    it('should work with only collectionPrefix', () => {
      const result = getFileKey({
        collectionPrefix: 'collection',
        filename: 'test.png',
        useCompositePrefixes: true,
      })
      expect(result).toBe('collection/test.png')
    })

    it('should work with only docPrefix', () => {
      const result = getFileKey({
        docPrefix: 'document',
        filename: 'test.png',
        useCompositePrefixes: true,
      })
      expect(result).toBe('document/test.png')
    })

    it('should return only filename when both prefixes are empty', () => {
      const result = getFileKey({
        filename: 'test.png',
        useCompositePrefixes: true,
      })
      expect(result).toBe('test.png')
    })
  })

  describe('sanitization', () => {
    it('should remove path traversal segments from collectionPrefix', () => {
      const result = getFileKey({
        collectionPrefix: '../../../etc',
        filename: 'test.png',
        useCompositePrefixes: false,
      })
      expect(result).toBe('etc/test.png')
      expect(result).not.toContain('..')
    })

    it('should remove path traversal segments from docPrefix', () => {
      const result = getFileKey({
        docPrefix: 'a/../../outside',
        filename: 'test.png',
        useCompositePrefixes: false,
      })
      expect(result).toBe('a/outside/test.png')
      expect(result).not.toContain('..')
    })

    it('should remove control characters from prefixes', () => {
      const result = getFileKey({
        collectionPrefix: 'test\x00\x1fprefix',
        filename: 'test.png',
        useCompositePrefixes: false,
      })
      expect(result).toBe('testprefix/test.png')
      expect(result).not.toMatch(/[\x00-\x1f]/)
    })

    it('should sanitize both prefixes in composite mode', () => {
      const result = getFileKey({
        collectionPrefix: '../collection',
        docPrefix: '../../doc',
        filename: 'test.png',
        useCompositePrefixes: true,
      })
      expect(result).toBe('collection/doc/test.png')
      expect(result).not.toContain('..')
    })
  })
})
