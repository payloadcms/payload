import { describe, expect, it } from 'vitest'

import { getVideoThumbnailSrc, isVideoMimeType } from './getVideoThumbnailSrc.js'

describe('isVideoMimeType', () => {
  it.each([
    ['video/mp4', true],
    ['video/webm', true],
    ['video/quicktime', true],
    ['image/png', false],
    ['audio/mpeg', false],
    ['application/mp4', false],
    ['', false],
    [undefined, false],
  ])('should return %s -> %s', (mimeType, expected) => {
    expect(isVideoMimeType(mimeType)).toBe(expected)
  })
})

describe('getVideoThumbnailSrc', () => {
  it('should return the file url for a video without a thumbnail', () => {
    expect(
      getVideoThumbnailSrc({ mimeType: 'video/mp4', thumbnailURL: undefined, url: '/clip.mp4' }),
    ).toBe('/clip.mp4')
  })

  it('should return undefined when the video has an image thumbnail', () => {
    expect(
      getVideoThumbnailSrc({
        mimeType: 'video/mp4',
        thumbnailURL: '/clip-poster.jpg',
        url: '/clip.mp4',
      }),
    ).toBeUndefined()
  })

  it('should return undefined for non-video files', () => {
    expect(
      getVideoThumbnailSrc({ mimeType: 'image/png', thumbnailURL: undefined, url: '/a.png' }),
    ).toBeUndefined()
  })

  it('should return undefined when the video has no url', () => {
    expect(
      getVideoThumbnailSrc({ mimeType: 'video/mp4', thumbnailURL: undefined, url: undefined }),
    ).toBeUndefined()
  })
})
