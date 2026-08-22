import type { CollectionConfig, ImageSize } from 'payload'

import '@payloadcms/transformer-sharp'
import { describe, expect, test } from 'tstyche'

type CollectionUploadConfig = Exclude<NonNullable<CollectionConfig['upload']>, boolean>
type CollectionImageSize = NonNullable<CollectionUploadConfig['imageSizes']>[number]

describe('registered image size options', () => {
  test('should resolve SharpImageSizeOptions through RegisteredImageSizeOptions.sharp once @payloadcms/transformer-sharp is imported', () => {
    expect<'kernel' extends keyof ImageSize ? true : false>().type.toBe<true>()
    expect<'withoutEnlargement' extends keyof ImageSize ? true : false>().type.toBe<true>()
    expect<ImageSize['width']>().type.toBe<number | undefined>()
    expect<ImageSize['height']>().type.toBe<number | undefined>()
    // Deprecated per-size Sharp position string, distinct from the top-level `crop` boolean.
    expect<ImageSize['crop']>().type.toBe<string | undefined>()
    expect<'formatOptions' extends keyof ImageSize ? true : false>().type.toBe<true>()
  })

  test('should apply registered options to collection upload configuration', () => {
    expect<CollectionImageSize>().type.toBe<ImageSize>()
  })
})
