import { describe, expect, it } from 'vitest'

import { getFileDownloadSrc, getFilePreviewSrc } from './getFilePreviewSrc.js'

const imageDoc = {
  mimeType: 'image/png',
  thumbnailURL: '/thumbnail.png',
  url: '/original.png',
}

const nonImageDoc = {
  mimeType: 'application/zip',
  thumbnailURL: '/thumbnail.png',
  url: '/archive.zip',
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

  it('should use the thumbnail for images without a url', () => {
    expect(getFilePreviewSrc({ data: { ...imageDoc, url: undefined } })).toBe('/thumbnail.png')
  })

  it('should use the thumbnail for non-images', () => {
    expect(getFilePreviewSrc({ data: nonImageDoc })).toBe('/thumbnail.png')
  })

  it('should use the original url when the selected size has no url', () => {
    expect(getFilePreviewSrc({ data: imageDoc, selectedSizeData: { url: null } })).toBe(
      '/original.png',
    )
  })
})

describe('getFileDownloadSrc', () => {
  it('should use the selected size url when a size is selected', () => {
    expect(getFileDownloadSrc({ data: imageDoc, selectedSizeData: { url: '/small.png' } })).toBe(
      '/small.png',
    )
  })

  it('should use the original url instead of the thumbnail for non-images', () => {
    expect(getFileDownloadSrc({ data: nonImageDoc })).toBe('/archive.zip')
  })
})
