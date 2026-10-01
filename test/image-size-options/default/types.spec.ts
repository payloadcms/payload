import type { CollectionConfig, ImageSize } from 'payload'

import { describe, expect, test } from 'tstyche'

type CollectionUploadConfig = Exclude<NonNullable<CollectionConfig['upload']>, boolean>
type CollectionImageSize = NonNullable<CollectionUploadConfig['imageSizes']>[number]

describe('default image size options', () => {
  test('should use Sharp options when no provider is registered', () => {
    expect<'kernel' extends keyof ImageSize ? true : false>().type.toBe<true>()
    expect<'withoutEnlargement' extends keyof ImageSize ? true : false>().type.toBe<true>()
    expect<{
      height: number
      kernel: 'lanczos3'
      name: string
      width: number
      withoutEnlargement: true
    }>().type.toBeAssignableTo<ImageSize>()
  })

  test('should apply Sharp options to collection upload configuration', () => {
    expect<CollectionImageSize>().type.toBe<ImageSize>()
  })
})
