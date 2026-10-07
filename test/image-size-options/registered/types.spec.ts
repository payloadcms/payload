import type { SharpCollectionConfig } from '@payloadcms/transformer-sharp'
import type { ImageSize } from 'payload'

import '@payloadcms/transformer-sharp'
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

type SharpVariant = NonNullable<SharpCollectionConfig['variants']>[number]

describe('registered image size options', () => {
  test('should accept the options registered by @payloadcms/transformer-sharp', () => {
    expect<{
      kernel: 'lanczos3'
      name: string
      withoutEnlargement: true
    }>().type.toBeAssignableTo<ImageSize>()
  })

  test('should accept options from a third-party provider registered alongside sharp', () => {
    expect<{
      fit: 'provider-fit'
      name: string
      providerOption: true
    }>().type.toBeAssignableTo<ImageSize>()
  })

  test('should apply registered options to sharp transformer variants', () => {
    expect<SharpVariant>().type.toBe<ImageSize>()
  })
})
