import { describe, expect, it } from 'vitest'

import type { Config } from '../config/types.js'

import { generateFilePathOrURL } from './generateFilePathOrURL.js'

describe('generateFilePathOrURL', () => {
  const serverURL = 'https://my-app.example.com'
  const config = { routes: { api: '/api' }, serverURL } as Config

  it('returns an external URL as-is when serverURL is configured', () => {
    const result = generateFilePathOrURL({
      collectionSlug: 'media',
      config,
      filename: 'image.png',
      relative: false,
      serverURL,
      urlOrPath: 'https://cdn.example.com/image.png',
    })

    expect(result).toBe('https://cdn.example.com/image.png')
  })

  it('returns an external URL as-is when serverURL is not configured', () => {
    // Regression test: an empty/undefined serverURL previously caused every
    // external URL (e.g. a cloud storage / CDN URL) to be misidentified as
    // internal, since `someString.startsWith('')` is always `true`.
    const result = generateFilePathOrURL({
      collectionSlug: 'media',
      config: { routes: { api: '/api' } } as Config,
      filename: 'image.png',
      relative: false,
      serverURL: '',
      urlOrPath: 'https://cdn.example.com/image.png',
    })

    expect(result).toBe('https://cdn.example.com/image.png')
  })

  it('falls back to the local file URL when urlOrPath is same-origin as serverURL', () => {
    const result = generateFilePathOrURL({
      collectionSlug: 'media',
      config,
      filename: 'image.png',
      relative: false,
      serverURL,
      urlOrPath: `${serverURL}/api/media/file/image.png`,
    })

    expect(result).toBe(`${serverURL}/api/media/file/image.png`)
  })

  it('falls back to the local file URL when urlOrPath is a relative path', () => {
    const result = generateFilePathOrURL({
      collectionSlug: 'media',
      config,
      filename: 'image.png',
      relative: false,
      serverURL,
      urlOrPath: '/api/media/file/image.png',
    })

    expect(result).toBe(`${serverURL}/api/media/file/image.png`)
  })

  it('returns null when neither urlOrPath nor filename are provided', () => {
    const result = generateFilePathOrURL({
      collectionSlug: 'media',
      config,
      filename: undefined,
      relative: false,
      serverURL,
      urlOrPath: undefined,
    })

    expect(result).toBeNull()
  })
})
