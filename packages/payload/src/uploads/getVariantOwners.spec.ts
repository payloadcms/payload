import { describe, expect, it } from 'vitest'

import { getVariantOwner, getVariantOwners } from './getVariantOwners.js'

const upload = {
  variantOwners: [
    { slug: 'sharp', mimeTypes: ['image/jpeg', 'image/png'], variantNames: ['thumbnail', 'card'] },
    { slug: 'poster', mimeTypes: ['video/mp4'], variantNames: ['thumbnail'] },
    { slug: 'blur', mimeTypes: ['video/*'], variantNames: ['blurhash'] },
  ],
}

describe('getVariantOwners', () => {
  it('should return every owner whose MIME types match the file', () => {
    expect(getVariantOwners({ mimeType: 'video/mp4', upload }).map(({ slug }) => slug)).toEqual([
      'poster',
      'blur',
    ])
  })

  it('should return no owners when none match, or the MIME type is not known', () => {
    expect(getVariantOwners({ mimeType: 'application/pdf', upload })).toEqual([])
    expect(getVariantOwners({ mimeType: undefined, upload })).toEqual([])
    expect(getVariantOwners({ mimeType: 'image/png', upload: {} })).toEqual([])
  })
})

describe('getVariantOwner', () => {
  it('should return the owner of one variant for the file', () => {
    expect(getVariantOwner({ mimeType: 'video/mp4', upload, variantName: 'thumbnail' })?.slug).toBe(
      'poster',
    )
    expect(getVariantOwner({ mimeType: 'image/png', upload, variantName: 'thumbnail' })?.slug).toBe(
      'sharp',
    )
  })

  it('should return undefined when no owner makes that variant for the file', () => {
    expect(getVariantOwner({ mimeType: 'video/mp4', upload, variantName: 'card' })).toBeUndefined()
  })
})
