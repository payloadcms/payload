import { describe, expect, it } from 'vitest'

import { getDocumentThumbnail } from './getDocumentThumbnail.js'

const image = {
  mimeType: 'image/png',
  thumbnailURL: '/thumbnail.png',
  url: '/original.png',
}

describe('getDocumentThumbnail', () => {
  it.each([
    { cover: image },
    { cover: [image] },
    { cover: { relationTo: 'media', value: image } },
    { cover: [{ relationTo: 'media', value: image }] },
  ])('should resolve populated upload fields %j', (doc) => {
    expect(getDocumentThumbnail({ doc, useAsThumbnail: 'cover' })).toBe('/thumbnail.png')
  })

  it.each([
    { cover: [] },
    { cover: ['unpopulated-id'] },
    { cover: { relationTo: 'media', value: 'unpopulated-id' } },
    { cover: null },
  ])('should leave unavailable uploads to the card placeholder %j', (doc) => {
    expect(getDocumentThumbnail({ doc, useAsThumbnail: 'cover' })).toBeUndefined()
  })

  it('should use generated variants to select an upload image preview', () => {
    const doc = {
      mimeType: 'image/png',
      url: '/original.png',
      variants: { small: { url: '/small.png', width: 100 } },
      width: 1000,
    }

    expect(getDocumentThumbnail({ doc })).toBe('/small.png')
  })

  it('should use the original image when there is no generated preview', () => {
    expect(getDocumentThumbnail({ doc: { ...image, thumbnailURL: null } })).toBe('/original.png')
  })

  it('should leave non-image files without a preview to the card placeholder', () => {
    expect(
      getDocumentThumbnail({ doc: { mimeType: 'application/pdf', url: '/document.pdf' } }),
    ).toBeUndefined()
  })

  it('should retain a custom preview for a non-image file', () => {
    expect(
      getDocumentThumbnail({
        doc: { mimeType: 'application/pdf', thumbnailURL: '/preview.png', url: '/document.pdf' },
      }),
    ).toBe('/preview.png')
  })
})
