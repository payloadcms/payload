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

  it('should use the original url instead of the thumbnail for images', () => {
    expect(getFilePreviewSrc({ data: imageDoc })).toBe('/original.png')
  })
})
