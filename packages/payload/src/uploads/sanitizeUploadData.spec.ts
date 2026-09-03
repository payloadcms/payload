import { describe, expect, it } from 'vitest'

import {
  getExternalUploadSource,
  getLocalizedUploadProperties,
  getUploadDestinationPrefix,
  mergeUploadDataWithDocument,
  restoreUploadDataFromDocument,
  sanitizeUploadData,
} from './sanitizeUploadData.js'
import { flattenAllFields } from '../utilities/flattenAllFields.js'

describe('sanitizeUploadData', () => {
  it('should preserve only the temporary external upload source', () => {
    expect(
      getExternalUploadSource({
        alt: 'Alternative text',
        filename: 'remote.png',
        sizes: { thumbnail: { filename: 'submitted-thumbnail.png' } },
        url: 'https://example.com/remote.png',
      }),
    ).toEqual({
      filename: 'remote.png',
      url: 'https://example.com/remote.png',
    })
  })

  it('should remove submitted generated file data on update', () => {
    expect(
      sanitizeUploadData(
        {
          alt: 'Updated alternative text',
          filename: 'submitted.png',
          prefix: 'articles',
          sizes: {
            thumbnail: {
              filename: 'submitted-thumbnail.png',
              height: 100,
              width: 100,
            },
          },
          url: '/api/media/file/submitted.png',
        },
        'update',
      ),
    ).toEqual({
      alt: 'Updated alternative text',
    })
  })

  it('should preserve a submitted prefix on create', () => {
    expect(
      sanitizeUploadData(
        {
          filename: 'submitted.png',
          prefix: 'articles',
        },
        'create',
      ),
    ).toEqual({
      prefix: 'articles',
    })
  })

  it('should use a submitted prefix when writing a new file', () => {
    expect(getUploadDestinationPrefix({ prefix: 'articles' }, {})).toBe('articles')
  })

  it('should use the destination bound to a client upload context', () => {
    expect(
      getUploadDestinationPrefix(
        { prefix: 'submitted' },
        { clientUploadContext: { prefix: 'provider' } },
      ),
    ).toBe('provider')
    expect(
      getUploadDestinationPrefix(
        { prefix: 'submitted' },
        { clientUploadContext: { key: 'provider/file.png' } },
      ),
    ).toBeUndefined()
  })

  it('should not preserve a submitted prefix without a new file', () => {
    expect(getUploadDestinationPrefix({ prefix: 'articles' }, undefined)).toBeUndefined()
  })

  it.each([
    { filename: '../submitted.png' },
    { filename: '/submitted.png' },
    { filename: 'C:\\submitted.png' },
    { filename: '\\\\server\\submitted.png' },
    { filename: 'images/../submitted.png' },
    { sizes: { thumbnail: { filename: '..\\submitted-thumbnail.png' } } },
  ])('should reject an invalid submitted filename', (data) => {
    expect(() => sanitizeUploadData(data, 'update')).toThrow('Invalid filename.')
  })
})

describe('mergeUploadDataWithDocument', () => {
  it('should add stored generated file data to an update', () => {
    expect(
      mergeUploadDataWithDocument(
        { alt: 'Updated alternative text' },
        {
          filename: 'stored.png',
          prefix: 'articles',
          sizes: {
            thumbnail: {
              filename: 'stored-thumbnail.png',
              height: 100,
              width: 100,
            },
          },
          url: '/api/media/file/stored.png',
        },
      ),
    ).toEqual({
      alt: 'Updated alternative text',
      filename: 'stored.png',
      prefix: 'articles',
      sizes: {
        thumbnail: {
          filename: 'stored-thumbnail.png',
          height: 100,
          width: 100,
        },
      },
      url: '/api/media/file/stored.png',
    })
  })

  it('should preserve generated file data supplied by a trusted hook', () => {
    expect(
      mergeUploadDataWithDocument(
        {
          filename: 'hook.png',
          prefix: 'hook-prefix',
          sizes: { thumbnail: { filename: 'hook-thumbnail.png' } },
          url: '/api/media/file/hook.png',
        },
        {
          filename: 'stored.png',
          prefix: 'stored-prefix',
          sizes: {
            thumbnail: { filename: 'stored-thumbnail.png', height: 100, width: 100 },
          },
          url: '/api/media/file/stored.png',
        },
      ),
    ).toEqual({
      filename: 'hook.png',
      prefix: 'hook-prefix',
      sizes: {
        thumbnail: { filename: 'hook-thumbnail.png', height: 100, width: 100 },
      },
      url: '/api/media/file/hook.png',
    })
  })

  it('should merge the selected value for localized generated file data', () => {
    expect(
      mergeUploadDataWithDocument(
        { alt: 'Updated alternative text' },
        { prefix: { en: 'current-prefix', es: 'prefijo-actual' } },
        { locale: 'en', localizedProperties: new Set(['prefix']) },
      ),
    ).toEqual({ alt: 'Updated alternative text', prefix: 'current-prefix' })
  })
})

describe('getLocalizedUploadProperties', () => {
  it('should identify localized flattened fields', () => {
    expect(
      getLocalizedUploadProperties(
        flattenAllFields({
          fields: [
            {
              fields: [
                { localized: true, name: 'prefix', type: 'text' },
                { name: 'url', type: 'text' },
              ],
              type: 'row',
            },
          ],
        }),
      ),
    ).toEqual(new Set(['prefix']))
  })
})

describe('restoreUploadDataFromDocument', () => {
  it('should replace the complete generated file tuple and preserve missing values', () => {
    expect(
      restoreUploadDataFromDocument(
        { filename: 'version.png', focalX: 10, thumbnailURL: '/version-thumbnail.png' },
        { filename: 'current.png', thumbnailURL: null },
      ),
    ).toEqual({ filename: 'current.png', thumbnailURL: null })
  })

  it('should restore the selected value for localized generated file data', () => {
    expect(
      restoreUploadDataFromDocument(
        { prefix: 'version-prefix' },
        { prefix: { en: 'current-prefix', es: 'prefijo-actual' } },
        { locale: 'en', localizedProperties: new Set(['prefix']) },
      ),
    ).toEqual({ prefix: 'current-prefix' })
  })
})
