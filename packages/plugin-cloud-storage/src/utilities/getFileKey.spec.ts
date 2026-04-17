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
      expect(result).toEqual({
        fileKey: 'document/test.png',
        sanitizedCollectionPrefix: 'collection',
        sanitizedDocPrefix: 'document',
        sanitizedFilename: 'test.png',
      })
    })

    it('should fallback to collectionPrefix when docPrefix is empty', () => {
      const result = getFileKey({
        collectionPrefix: 'collection',
        docPrefix: '',
        filename: 'test.png',
        useCompositePrefixes: false,
      })
      expect(result).toEqual({
        fileKey: 'collection/test.png',
        sanitizedCollectionPrefix: 'collection',
        sanitizedDocPrefix: '',
        sanitizedFilename: 'test.png',
      })
    })

    it('should fallback to collectionPrefix when docPrefix is undefined', () => {
      const result = getFileKey({
        collectionPrefix: 'collection',
        filename: 'test.png',
        useCompositePrefixes: false,
      })
      expect(result).toEqual({
        fileKey: 'collection/test.png',
        sanitizedCollectionPrefix: 'collection',
        sanitizedDocPrefix: '',
        sanitizedFilename: 'test.png',
      })
    })

    it('should return only filename when both prefixes are empty', () => {
      const result = getFileKey({
        filename: 'test.png',
        useCompositePrefixes: false,
      })
      expect(result).toEqual({
        fileKey: 'test.png',
        sanitizedCollectionPrefix: '',
        sanitizedDocPrefix: '',
        sanitizedFilename: 'test.png',
      })
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
      expect(result).toEqual({
        fileKey: 'collection/document/test.png',
        sanitizedCollectionPrefix: 'collection',
        sanitizedDocPrefix: 'document',
        sanitizedFilename: 'test.png',
      })
    })

    it('should work with only collectionPrefix', () => {
      const result = getFileKey({
        collectionPrefix: 'collection',
        filename: 'test.png',
        useCompositePrefixes: true,
      })
      expect(result).toEqual({
        fileKey: 'collection/test.png',
        sanitizedCollectionPrefix: 'collection',
        sanitizedDocPrefix: '',
        sanitizedFilename: 'test.png',
      })
    })

    it('should work with only docPrefix', () => {
      const result = getFileKey({
        docPrefix: 'document',
        filename: 'test.png',
        useCompositePrefixes: true,
      })
      expect(result).toEqual({
        fileKey: 'document/test.png',
        sanitizedCollectionPrefix: '',
        sanitizedDocPrefix: 'document',
        sanitizedFilename: 'test.png',
      })
    })

    it('should return only filename when both prefixes are empty', () => {
      const result = getFileKey({
        filename: 'test.png',
        useCompositePrefixes: true,
      })
      expect(result).toEqual({
        fileKey: 'test.png',
        sanitizedCollectionPrefix: '',
        sanitizedDocPrefix: '',
        sanitizedFilename: 'test.png',
      })
    })
  })

  describe('sanitization', () => {
    it('should remove path traversal segments from collectionPrefix', () => {
      const result = getFileKey({
        collectionPrefix: '../../../etc',
        filename: 'test.png',
        useCompositePrefixes: false,
      })
      expect(result).toEqual({
        fileKey: 'etc/test.png',
        sanitizedCollectionPrefix: 'etc',
        sanitizedDocPrefix: '',
        sanitizedFilename: 'test.png',
      })
      expect(result.fileKey).not.toContain('..')
    })

    it('should remove path traversal segments from docPrefix', () => {
      const result = getFileKey({
        docPrefix: 'a/../../outside',
        filename: 'test.png',
        useCompositePrefixes: false,
      })
      expect(result).toEqual({
        fileKey: 'a/outside/test.png',
        sanitizedCollectionPrefix: '',
        sanitizedDocPrefix: 'a/outside',
        sanitizedFilename: 'test.png',
      })
      expect(result.fileKey).not.toContain('..')
    })

    it('should remove control characters from prefixes', () => {
      const result = getFileKey({
        collectionPrefix: 'test\x00\x1fprefix',
        filename: 'test.png',
        useCompositePrefixes: false,
      })
      expect(result).toEqual({
        fileKey: 'testprefix/test.png',
        sanitizedCollectionPrefix: 'testprefix',
        sanitizedDocPrefix: '',
        sanitizedFilename: 'test.png',
      })
      expect(result.fileKey).not.toMatch(/[\x00-\x1f]/)
    })

    it('should sanitize both prefixes in composite mode', () => {
      const result = getFileKey({
        collectionPrefix: '../collection',
        docPrefix: '../../doc',
        filename: 'test.png',
        useCompositePrefixes: true,
      })
      expect(result).toEqual({
        fileKey: 'collection/doc/test.png',
        sanitizedCollectionPrefix: 'collection',
        sanitizedDocPrefix: 'doc',
        sanitizedFilename: 'test.png',
      })
      expect(result.fileKey).not.toContain('..')
    })
  })
})
