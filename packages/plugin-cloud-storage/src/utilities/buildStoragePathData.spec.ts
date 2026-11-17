import {
  buildStoragePathData,
  buildUploadStoragePathData,
  isStoragePathWithinCollectionPrefix,
} from './buildStoragePathData.js'
import { describe, expect, it } from 'vitest'

describe('buildStoragePathData', () => {
  describe('non-composite mode (useCompositePrefixes: false)', () => {
    it('should preserve the key of a legacy document outside the collection prefix', () => {
      const result = buildStoragePathData({
        collectionPrefix: 'media/',
        docPrefix: 'media-archive',
        filename: 'test.png',
        useCompositePrefixes: false,
      })

      expect(result).toEqual({
        fileKey: 'media-archive/test.png',
        sanitizedCollectionPrefix: 'media',
        sanitizedDocPrefix: 'media-archive',
        sanitizedFilename: 'test.png',
        storageFilePath: 'media-archive/test.png',
      })
    })

    it('should fallback to collectionPrefix when docPrefix is empty', () => {
      const result = buildStoragePathData({
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
        storageFilePath: 'collection/test.png',
      })
    })

    it('should fallback to collectionPrefix when docPrefix is undefined', () => {
      const result = buildStoragePathData({
        collectionPrefix: 'collection',
        filename: 'test.png',
        useCompositePrefixes: false,
      })
      expect(result).toEqual({
        fileKey: 'collection/test.png',
        sanitizedCollectionPrefix: 'collection',
        sanitizedDocPrefix: '',
        sanitizedFilename: 'test.png',
        storageFilePath: 'collection/test.png',
      })
    })

    it('should return only filename when both prefixes are empty', () => {
      const result = buildStoragePathData({
        filename: 'test.png',
        useCompositePrefixes: false,
      })
      expect(result).toEqual({
        fileKey: 'test.png',
        sanitizedCollectionPrefix: '',
        sanitizedDocPrefix: '',
        sanitizedFilename: 'test.png',
        storageFilePath: 'test.png',
      })
    })
  })

  describe('composite mode (useCompositePrefixes: true)', () => {
    it('should combine collectionPrefix and docPrefix', () => {
      const result = buildStoragePathData({
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
        storageFilePath: 'collection/document/test.png',
      })
    })

    it('should work with only collectionPrefix', () => {
      const result = buildStoragePathData({
        collectionPrefix: 'collection',
        filename: 'test.png',
        useCompositePrefixes: true,
      })
      expect(result).toEqual({
        fileKey: 'collection/test.png',
        sanitizedCollectionPrefix: 'collection',
        sanitizedDocPrefix: '',
        sanitizedFilename: 'test.png',
        storageFilePath: 'collection/test.png',
      })
    })

    it('should work with only docPrefix', () => {
      const result = buildStoragePathData({
        docPrefix: 'document',
        filename: 'test.png',
        useCompositePrefixes: true,
      })
      expect(result).toEqual({
        fileKey: 'document/test.png',
        sanitizedCollectionPrefix: '',
        sanitizedDocPrefix: 'document',
        sanitizedFilename: 'test.png',
        storageFilePath: 'document/test.png',
      })
    })

    it('should return only filename when both prefixes are empty', () => {
      const result = buildStoragePathData({
        filename: 'test.png',
        useCompositePrefixes: true,
      })
      expect(result).toEqual({
        fileKey: 'test.png',
        sanitizedCollectionPrefix: '',
        sanitizedDocPrefix: '',
        sanitizedFilename: 'test.png',
        storageFilePath: 'test.png',
      })
    })
  })

  describe('collection prefix boundaries', () => {
    it('should accept a file key within a slash-terminated collection prefix', () => {
      expect(
        isStoragePathWithinCollectionPrefix({
          collectionPrefix: 'media/',
          docPrefix: 'media/documents/test.png',
        }),
      ).toBe(true)
    })
  })

  describe('sanitization', () => {
    it.each(['./media/./images', 'media\\images', '/media//images'])(
      'should canonicalize equivalent prefix paths',
      (docPrefix) => {
        const result = buildStoragePathData({ docPrefix, filename: 'test.png' })

        expect(result).toEqual({
          fileKey: 'media/images/test.png',
          sanitizedCollectionPrefix: '',
          sanitizedDocPrefix: 'media/images',
          sanitizedFilename: 'test.png',
          storageFilePath: 'media/images/test.png',
        })
      },
    )

    it('should remove path traversal segments from collectionPrefix', () => {
      const result = buildStoragePathData({
        collectionPrefix: '../../../etc',
        filename: 'test.png',
        useCompositePrefixes: false,
      })
      expect(result).toEqual({
        fileKey: 'etc/test.png',
        sanitizedCollectionPrefix: 'etc',
        sanitizedDocPrefix: '',
        sanitizedFilename: 'test.png',
        storageFilePath: 'etc/test.png',
      })
      expect(result.fileKey).not.toContain('..')
    })

    it('should remove path traversal segments from docPrefix', () => {
      const result = buildStoragePathData({
        docPrefix: 'a/../../outside',
        filename: 'test.png',
        useCompositePrefixes: false,
      })
      expect(result).toEqual({
        fileKey: 'a/outside/test.png',
        sanitizedCollectionPrefix: '',
        sanitizedDocPrefix: 'a/outside',
        sanitizedFilename: 'test.png',
        storageFilePath: 'a/outside/test.png',
      })
      expect(result.fileKey).not.toContain('..')
    })

    it('should remove control characters from prefixes', () => {
      const result = buildStoragePathData({
        collectionPrefix: 'test\x00\x1fprefix',
        filename: 'test.png',
        useCompositePrefixes: false,
      })
      expect(result).toEqual({
        fileKey: 'testprefix/test.png',
        sanitizedCollectionPrefix: 'testprefix',
        sanitizedDocPrefix: '',
        sanitizedFilename: 'test.png',
        storageFilePath: 'testprefix/test.png',
      })
      expect(result.fileKey).not.toMatch(/[\x00-\x1f]/)
    })

    it('should normalize both prefixes after removing control characters in composite mode', () => {
      const result = buildStoragePathData({
        collectionPrefix: '.\x00./collection',
        docPrefix: '.\x00./doc',
        filename: 'test.png',
        useCompositePrefixes: true,
      })
      expect(result).toEqual({
        fileKey: 'collection/doc/test.png',
        sanitizedCollectionPrefix: 'collection',
        sanitizedDocPrefix: 'doc',
        sanitizedFilename: 'test.png',
        storageFilePath: 'collection/doc/test.png',
      })
      expect(result.fileKey).not.toContain('..')
    })
  })
})

describe('buildUploadStoragePathData', () => {
  it.each([
    ['invoices', false, 'media/invoices/file.png', 'media/invoices'],
    ['media/invoices', false, 'media/invoices/file.png', 'media/invoices'],
    ['', false, 'media/file.png', ''],
    ['invoices', true, 'media/invoices/file.png', 'invoices'],
  ] as const)(
    'should persist a readable destination for %s (composite %s)',
    (docPrefix, useCompositePrefixes, fileKey, storedPrefix) => {
      const result = buildUploadStoragePathData({
        collectionPrefix: 'media',
        docPrefix,
        filename: 'file.png',
        useCompositePrefixes,
      })

      expect(result.storageFilePath).toBe(fileKey)
      expect(result.sanitizedDocPrefix).toBe(storedPrefix)
      expect(
        buildStoragePathData({
          collectionPrefix: 'media',
          docPrefix: result.sanitizedDocPrefix,
          filename: 'file.png',
          useCompositePrefixes,
        }).fileKey,
      ).toBe(fileKey)
    },
  )
})
