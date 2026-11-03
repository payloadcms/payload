import type { Config } from '../config/types.js'

import { describe, expect, it } from 'vitest'

import { registerUploadVariants } from './registerUploadVariants.js'

const makeConfig = (): Config =>
  ({
    collections: [{ slug: 'media', fields: [], upload: { staticDir: 'media' } }],
  }) as unknown as Config

describe('registerUploadVariants', () => {
  it('should register names and admin options only', () => {
    const result = registerUploadVariants({
      collections: { media: { variants: [{ name: 'card', width: 800 } as { name: string }] } },
      config: makeConfig(),
      label: 'cdnTransformer',
    })

    expect(result.collections?.[0]?.upload).toEqual({
      staticDir: 'media',
      variants: [{ admin: undefined, generateImageName: undefined, name: 'card' }],
    })
  })

  it('should throw when another transformer already registered sizes on the collection', () => {
    const config = registerUploadVariants({
      collections: { media: { variants: [{ name: 'thumbnail' }] } },
      config: makeConfig(),
      label: 'sharpTransformer',
    })

    expect(() =>
      registerUploadVariants({
        collections: { media: { variants: [{ name: 'card' }] } },
        config,
        label: 'cdnTransformer',
      }),
    ).toThrow(
      'Invalid `cdnTransformer({ collections })` configuration:\ncdnTransformer collections."media" registers variants, but another transformer already registered variants on "media". Only one transformer can register variants on a collection.',
    )
  })
})
