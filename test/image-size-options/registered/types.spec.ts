import type { CollectionConfig, ImageSize } from 'payload'

import { describe, expect, test } from 'tstyche'

type TestImageSizeOptions = {
  fit?: 'provider-fit'
  providerOption?: boolean
  width?: number
}

declare module 'payload' {
  interface RegisteredImageSizeOptions {
    testProvider: TestImageSizeOptions
  }
}

type CollectionUploadConfig = Exclude<NonNullable<CollectionConfig['upload']>, boolean>
type CollectionImageSize = NonNullable<CollectionUploadConfig['imageSizes']>[number]

describe('registered image size options', () => {
  test('should use registered provider options in ImageSize', () => {
    expect<ImageSize['name']>().type.toBe<string>()
    expect<ImageSize['fit']>().type.toBe<'provider-fit' | undefined>()
    expect<ImageSize['providerOption']>().type.toBe<boolean | undefined>()
    expect<ImageSize['width']>().type.toBe<number | undefined>()
  })

  test('should replace Sharp-specific options', () => {
    expect<'kernel' extends keyof ImageSize ? true : false>().type.toBe<false>()
    expect<'withoutEnlargement' extends keyof ImageSize ? true : false>().type.toBe<false>()
  })

  test('should apply registered options to collection upload configuration', () => {
    expect<CollectionImageSize>().type.toBe<ImageSize>()
  })
})
