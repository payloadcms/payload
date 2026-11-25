import type { Config } from '../config/types.js'

import { describe, expect, it } from 'vitest'

import { registerUploadVariants } from './registerUploadVariants.js'
import { uploadTransformerInternal } from './transformers/uploadTransformerBridge.js'

const makeConfig = (): Config =>
  ({
    collections: [{ slug: 'media', fields: [], upload: { staticDir: 'media' } }],
    upload: {
      transformers: [
        { slug: 'cdn', mimeTypes: ['image/png', 'image/webp'] },
        {
          slug: 'sharp',
          mimeTypes: ['image/jpeg', 'image/png'],
          [uploadTransformerInternal]: { transformUpload: async () => [] },
        },
        { slug: 'video', mimeTypes: ['video/*'] },
        { slug: 'poster', mimeTypes: ['video/mp4'] },
        { slug: 'blur', mimeTypes: ['video/*', 'image/png'] },
        { slug: 'everything', mimeTypes: ['*/*'] },
      ],
    },
  }) as unknown as Config

/** Registers each `[transformerSlug, variantNames]` in order. */
const registerAll = (registrations: [string, string[]][]): Config =>
  registrations.reduce(
    (config, [transformerSlug, names]) =>
      registerUploadVariants({
        collections: { media: { variants: names.map((name) => ({ name })) } },
        config,
        transformerSlug,
      }),
    makeConfig(),
  )

describe('registerUploadVariants', () => {
  it('should register names and admin options only, with the transformer as the owner', () => {
    const result = registerUploadVariants({
      collections: { media: { variants: [{ name: 'card', width: 800 } as { name: string }] } },
      config: makeConfig(),
      transformerSlug: 'cdn',
    })

    expect(result.collections?.[0]?.upload).toEqual({
      staticDir: 'media',
      variantOwners: [
        { slug: 'cdn', mimeTypes: ['image/png', 'image/webp'], variantNames: ['card'] },
      ],
      variants: [{ admin: undefined, generateImageName: undefined, name: 'card' }],
    })
  })

  it('should preserve registered sizes and their owner when another transformer has no sizes', () => {
    const config = registerUploadVariants({
      collections: { media: { variants: [{ name: 'card' }] } },
      config: makeConfig(),
      transformerSlug: 'cdn',
    })

    const result = registerUploadVariants({
      collections: { media: { variants: [] } },
      config,
      transformerSlug: 'sharp',
    })

    expect(result.collections?.[0]?.upload).toMatchObject({
      variantOwners: [{ slug: 'cdn', variantNames: ['card'] }],
      variants: [{ name: 'card' }],
    })
  })

  it('should merge a second owner whose MIME types do not overlap', () => {
    const result = registerAll([
      ['sharp', ['thumbnail', 'card']],
      ['video', ['thumbnail']],
    ])

    expect(result.collections?.[0]?.upload).toMatchObject({
      variantOwners: [
        { slug: 'sharp', variantNames: ['thumbnail', 'card'] },
        { slug: 'video', mimeTypes: ['video/*'], variantNames: ['thumbnail'] },
      ],
      variants: [{ name: 'thumbnail' }, { name: 'card' }],
    })
  })

  it('should allow two owners with different names on one MIME type when neither is a bridge', () => {
    const result = registerAll([
      ['poster', ['thumbnail']],
      ['video', ['blurhash']],
    ])

    expect(
      (result.collections?.[0]?.upload as { variantOwners: { slug: string }[] }).variantOwners.map(
        ({ slug }) => slug,
      ),
    ).toEqual(['poster', 'video'])
  })

  it('should give the same variants whichever owner registers first', () => {
    const names = (config: Config) =>
      (config.collections?.[0]?.upload as { variants: { name: string }[] }).variants
        .map(({ name }) => name)
        .sort()

    expect(
      names(
        registerAll([
          ['sharp', ['thumbnail', 'card']],
          ['video', ['thumbnail']],
        ]),
      ),
    ).toEqual(
      names(
        registerAll([
          ['video', ['thumbnail']],
          ['sharp', ['thumbnail', 'card']],
        ]),
      ),
    )
  })

  it('should throw when two owners of one name have MIME types that overlap', () => {
    expect(() =>
      registerAll([
        ['video', ['thumbnail']],
        ['poster', ['thumbnail']],
      ]),
    ).toThrow(
      'Invalid upload variants from transformer "poster":\ncollections."media".variants."thumbnail": "poster" and "video" both make it for "video/mp4". A variant name can have only one owner for each MIME type.',
    )
  })

  it('should throw when an owner of every MIME type shares a name with another owner', () => {
    expect(() =>
      registerAll([
        ['video', ['thumbnail']],
        ['everything', ['thumbnail']],
      ]),
    ).toThrow('"everything" and "video" both make it for "*/*"')
  })

  it('should throw when another owner joins a MIME type that has a bridge owner', () => {
    expect(() =>
      registerAll([
        ['sharp', ['thumbnail']],
        ['blur', ['blurhash']],
      ]),
    ).toThrow(
      'collections."media": "blur" and "sharp" both make variants for "image/png", and "sharp" uses the upload bridge. A MIME type with a bridge owner can have no other owner.',
    )
  })

  it('should throw when two owners give one variant name different admin options', () => {
    const config = registerUploadVariants({
      collections: {
        media: { variants: [{ name: 'thumbnail', admin: { disableListColumn: true } }] },
      },
      config: makeConfig(),
      transformerSlug: 'sharp',
    })

    expect(() =>
      registerUploadVariants({
        collections: { media: { variants: [{ name: 'thumbnail' }] } },
        config,
        transformerSlug: 'video',
      }),
    ).toThrow(
      'collections."media".variants."thumbnail" has different `admin` or `generateImageName` options in "sharp" and "video". Give the shared name the same options.',
    )
  })

  it('should throw when one transformer registers the same collection twice', () => {
    expect(() =>
      registerAll([
        ['video', ['thumbnail']],
        ['video', ['poster']],
      ]),
    ).toThrow('collections."media": "video" already registered variants on "media".')
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

  it.each(['../card', 'a/card', 'a\\card'])(
    'should reject the size name %j, which is not a safe file name part',
    (name) => {
      expect(() =>
        registerUploadVariants({
          collections: { media: { variants: [{ name }] } },
          config: makeConfig(),
          transformerSlug: 'cdn',
        }),
      ).toThrow(
        `collections."media".variants uses name "${name}", which contains a path separator or "..". Size names are part of file names.`,
      )
    },
  )
})
