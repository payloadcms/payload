import { afterEach, describe, expect, it } from 'vitest'

import { resolveConfig } from './resolveConfig.js'

const originalEnv = process.env.CLOUDINARY_URL

afterEach(() => {
  process.env.CLOUDINARY_URL = originalEnv
})

describe('resolveConfig', () => {
  it('should read credentials from a Cloudinary URL', () => {
    expect(resolveConfig({ url: 'cloudinary://key:secret@my-cloud' })).toStrictEqual({
      api_key: 'key',
      api_secret: 'secret',
      cloud_name: 'my-cloud',
      secure: true,
    })
  })

  it('should fall back to CLOUDINARY_URL', () => {
    process.env.CLOUDINARY_URL = 'cloudinary://env-key:env-secret@env-cloud'

    expect(resolveConfig({})).toMatchObject({ api_key: 'env-key', cloud_name: 'env-cloud' })
  })

  it('should let explicit config win over the URL', () => {
    expect(
      resolveConfig({
        config: { cloud_name: 'explicit-cloud' },
        url: 'cloudinary://key:secret@url-cloud',
      }),
    ).toMatchObject({ api_key: 'key', cloud_name: 'explicit-cloud' })
  })

  it('should throw when credentials are incomplete', () => {
    process.env.CLOUDINARY_URL = ''

    expect(() => resolveConfig({ config: { cloud_name: 'my-cloud' } })).toThrow(
      /missing required credentials: api_key, api_secret/,
    )
  })

  it('should throw on a non-Cloudinary URL', () => {
    expect(() => resolveConfig({ url: 'https://key:secret@my-cloud' })).toThrow(
      /Invalid Cloudinary URL protocol/,
    )
  })
})
