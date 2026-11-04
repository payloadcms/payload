import { describe, expect, it } from 'vitest'

import { getFilePreviewSrc } from './getFilePreviewSrc.js'

const imageDoc = {
  mimeType: 'image/png',
  thumbnailURL: '/thumbnail.png',
  url: '/original.png',
}

describe('getFilePreviewSrc', () => {
  it('should use the selected size url when a size is selected', () => {
    expect(getFilePreviewSrc({ data: imageDoc, selectedSizeData: { url: '/small.png' } })).toBe(
      '/small.png',
    )
  })

  it('should use the original url for images when no size is selected', () => {
    expect(getFilePreviewSrc({ data: imageDoc, selectedSizeData: null })).toBe('/original.png')
  })

  it('should use the thumbnail for images without a url', () => {
    expect(
      getFilePreviewSrc({ data: { mimeType: 'image/png', thumbnailURL: '/thumbnail.png' } }),
    ).toBe('/thumbnail.png')
  })

  it('should use the thumbnail for non-image files', () => {
    expect(
      getFilePreviewSrc({
        data: { mimeType: 'application/pdf', thumbnailURL: '/thumbnail.png', url: '/file.pdf' },
      }),
    ).toBe('/thumbnail.png')
  })

  it('should use the original url for non-image files without a thumbnail', () => {
    expect(getFilePreviewSrc({ data: { mimeType: 'application/pdf', url: '/file.pdf' } })).toBe(
      '/file.pdf',
    )
  })

  it('should return null when no url is available', () => {
    expect(getFilePreviewSrc({ data: { mimeType: 'image/png' } })).toBeNull()
  })
})
