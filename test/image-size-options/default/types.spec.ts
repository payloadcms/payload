import type { CollectionConfig, ImageSize, SanitizedUploadConfig } from 'payload'

import { describe, expect, test } from 'tstyche'

type CollectionUploadConfig = Exclude<NonNullable<CollectionConfig['upload']>, boolean>
type SanitizedImageSize = NonNullable<SanitizedUploadConfig['imageSizes']>[number]

describe('default image size options', () => {
  test('should carry no processor-specific options when no provider is registered', () => {
    expect<'kernel' extends keyof ImageSize ? true : false>().type.toBe<false>()
    expect<'withoutEnlargement' extends keyof ImageSize ? true : false>().type.toBe<false>()
    expect<{
      admin?: never
      generateImageName?: never
      height: number
      name: string
      width: number
    }>().type.toBeAssignableTo<ImageSize>()
  })

  test('should apply the same (empty) options to the sanitized upload configuration', () => {
    expect<SanitizedImageSize>().type.toBe<ImageSize>()
  })

  test('should not allow imageSizes to be authored on a collection upload configuration', () => {
    expect<'imageSizes' extends keyof CollectionUploadConfig ? true : false>().type.toBe<false>()
  })
})
