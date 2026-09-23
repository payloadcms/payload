import { describe, expect, it } from 'vitest'

import type { ResolvedCloudinaryConfig } from './types.js'

import { buildFetchURL } from './buildFetchURL.js'

const config: ResolvedCloudinaryConfig = {
  api_key: 'key',
  api_secret: 'secret',
  cloud_name: 'my-cloud',
  secure: true,
}

describe('buildFetchURL', () => {
  it('should build a fetch delivery URL carrying the transformation', () => {
    const url = buildFetchURL({
      config,
      sourceURL: 'https://example.com/media/photo.png',
      transformation: { crop: 'fill', gravity: 'center', height: 300, quality: 'auto', width: 400 },
    })

    expect(url).toContain('https://res.cloudinary.com/my-cloud/image/fetch/')
    expect(url).toContain('c_fill')
    expect(url).toContain('w_400')
    expect(url).toContain('h_300')
    expect(url).toContain('g_center')
    expect(url).toContain('q_auto')
    expect(url).toContain('/https://example.com/media/photo.png')
  })

  it('should escape a source URL query string so it cannot truncate the fetch path', () => {
    const url = buildFetchURL({
      config,
      sourceURL: 'https://example.com/media/photo.png?prefix=test&v=2',
      transformation: { crop: 'scale', width: 400 },
    })

    expect(url).toBe(
      'https://res.cloudinary.com/my-cloud/image/fetch/c_scale,w_400/https://example.com/media/photo.png%3Fprefix%3Dtest%26v%3D2',
    )
  })

  it('should not append the SDK analytics parameter', () => {
    const url = buildFetchURL({
      config,
      sourceURL: 'https://example.com/media/photo.png',
      transformation: { crop: 'scale', width: 400 },
    })

    expect(url).not.toContain('_a=')
  })
})
