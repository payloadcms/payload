import type { Config } from '../config/types.js'

import { describe, expect, it } from 'vitest'

import { registerUploadVariants } from './registerUploadVariants.js'

const makeConfig = (): Config =>
  ({
    collections: [{ slug: 'media', fields: [], upload: { staticDir: 'media' } }],
    upload: { transformers: [{ slug: 'cdn' }, { slug: 'sharp' }] },
  }) as unknown as Config

describe('registerUploadVariants', () => {
  it('should register names and admin options only, with the transformer as the owner', () => {
    const result = registerUploadVariants({
      collections: { media: { variants: [{ name: 'card', width: 800 } as { name: string }] } },
      config: makeConfig(),
      transformerSlug: 'cdn',
    })

    expect(result.collections?.[0]?.upload).toEqual({
      staticDir: 'media',
      variants: [{ admin: undefined, generateImageName: undefined, name: 'card' }],
      variantsTransformerSlug: 'cdn',
    })
  })

  it('should throw when another transformer already registered sizes on the collection', () => {
    const config = registerUploadVariants({
      collections: { media: { variants: [{ name: 'thumbnail' }] } },
      config: makeConfig(),
      transformerSlug: 'sharp',
    })

    expect(() =>
      registerUploadVariants({
        collections: { media: { variants: [{ name: 'card' }] } },
        config,
        transformerSlug: 'cdn',
      }),
    ).toThrow(
      'Invalid upload variants from transformer "cdn":\ncollections."media" registers variants, but another transformer already registered variants on "media". Only one transformer can register variants on a collection.',
    )
  })

  it('should throw when no configured transformer has the given slug', () => {
    expect(() =>
      registerUploadVariants({
        collections: { media: { variants: [{ name: 'card' }] } },
        config: makeConfig(),
        transformerSlug: 'cnd',
      }),
    ).toThrow(
      'Invalid upload variants from transformer "cnd":\nno transformer in `upload.transformers` has the slug "cnd". Pass the slug of the transformer that registers the variants.',
    )
  })
})
