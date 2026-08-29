import { describe, expect, it } from 'vitest'

import type { Config } from '../config/types.js'

import { generateFilePathOrURL } from './generateFilePathOrURL.js'

describe('generateFilePathOrURL', () => {
  const config = { routes: { api: '/api' } } as Config

  it('should return an external url as is when serverURL is not configured', () => {
    const url = generateFilePathOrURL({
      collectionSlug: 'media',
      config,
      filename: 'image-300x225.png',
      relative: false,
      serverURL: undefined,
      urlOrPath: 'https://cdn.example.com/image-300x225.png',
    })

    expect(url).toBe('https://cdn.example.com/image-300x225.png')
  })

  it('should return an external url as is when it does not match serverURL', () => {
    const url = generateFilePathOrURL({
      collectionSlug: 'media',
      config: { ...config, serverURL: 'http://localhost:3000' },
      filename: 'image-300x225.png',
      relative: false,
      serverURL: 'http://localhost:3000',
      urlOrPath: 'https://cdn.example.com/image-300x225.png',
    })

    expect(url).toBe('https://cdn.example.com/image-300x225.png')
  })

  it('should regenerate the file route for urls pointing at serverURL', () => {
    const url = generateFilePathOrURL({
      collectionSlug: 'media',
      config: { ...config, serverURL: 'http://localhost:3000' },
      filename: 'image.png',
      relative: false,
      serverURL: 'http://localhost:3000',
      urlOrPath: 'http://localhost:3000/api/media/file/stale.png',
    })

    expect(url).toBe('http://localhost:3000/api/media/file/image.png')
  })

  it('should regenerate the file route for relative paths', () => {
    const url = generateFilePathOrURL({
      collectionSlug: 'media',
      config,
      filename: 'image.png',
      relative: true,
      urlOrPath: '/api/media/file/stale.png',
    })

    expect(url).toBe('/api/media/file/image.png')
  })
})
