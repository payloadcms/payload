import type { Config } from '../config/types.js'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { generateFilePathOrURL } from './generateFilePathOrURL.js'

describe('generateFilePathOrURL', () => {
  const serverURL = 'https://example.com'
  const config = { routes: { api: '/api' }, serverURL } as Config

  describe('with NEXT_TRAILING_SLASH enabled', () => {
    const originalTrailingSlash = process.env.NEXT_TRAILING_SLASH

    beforeEach(() => {
      process.env.NEXT_TRAILING_SLASH = 'true'
    })

    afterEach(() => {
      if (originalTrailingSlash === undefined) {
        delete process.env.NEXT_TRAILING_SLASH
      } else {
        process.env.NEXT_TRAILING_SLASH = originalTrailingSlash
      }
    })

    it('should not append a trailing slash to a relative file URL', () => {
      const result = generateFilePathOrURL({
        collectionSlug: 'media',
        config,
        filename: 'image.png',
        relative: true,
        urlOrPath: undefined,
      })

      expect(result).toBe(`${process.env.NEXT_BASE_PATH || ''}/api/media/file/image.png`)
    })

    it('should not append a trailing slash to an absolute file URL', () => {
      const result = generateFilePathOrURL({
        collectionSlug: 'media',
        config,
        filename: 'image.png',
        relative: false,
        urlOrPath: undefined,
      })

      expect(result).toBe(
        `${serverURL}${process.env.NEXT_BASE_PATH || ''}/api/media/file/image.png`,
      )
    })

    it('should keep the encoded filename intact', () => {
      const result = generateFilePathOrURL({
        collectionSlug: 'media',
        config,
        filename: 'my image.png',
        relative: true,
        urlOrPath: undefined,
      })

      expect(result).toBe(`${process.env.NEXT_BASE_PATH || ''}/api/media/file/my%20image.png`)
    })
  })

  it('should return external URLs unchanged', () => {
    const external = 'https://cdn.example.org/image.png'

    expect(
      generateFilePathOrURL({
        collectionSlug: 'media',
        config,
        filename: 'image.png',
        relative: false,
        serverURL,
        urlOrPath: external,
      }),
    ).toBe(external)
  })

  it('should return null without a filename or local path', () => {
    expect(
      generateFilePathOrURL({
        collectionSlug: 'media',
        config,
        relative: true,
        urlOrPath: undefined,
      }),
    ).toBeNull()
  })
})
