import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { getImageLoadState, Thumbnail, ThumbnailComponent } from './index.js'

describe('Thumbnail', () => {
  it('should treat a cached complete image as loaded', () => {
    expect(
      getImageLoadState({
        complete: true,
        naturalWidth: 100,
      }),
    ).toBe('loaded')
  })

  it('should treat a cached complete image without dimensions as errored', () => {
    expect(
      getImageLoadState({
        complete: true,
        naturalWidth: 0,
      }),
    ).toBe('error')
  })

  it('should wait for browser load events when an image is not complete', () => {
    expect(
      getImageLoadState({
        complete: false,
        naturalWidth: 0,
      }),
    ).toBeUndefined()
  })

  it('should render the image directly so the browser owns thumbnail loading', () => {
    const markup = renderToStaticMarkup(
      React.createElement(Thumbnail, {
        doc: { filename: 'photo.jpg' },
        fileSrc: '/api/media/file/photo.jpg',
        imageCacheTag: '2026-04-27T08:00:00.000Z',
        size: 'small',
      }),
    )

    expect(markup).toContain('<img')
    expect(markup).toContain('loading="lazy"')
    expect(markup).toContain('decoding="async"')
    expect(markup).toContain('/api/media/file/photo.jpg?2026-04-27T08%3A00%3A00.000Z')
  })

  it('should render the upload relationship image directly so the browser owns thumbnail loading', () => {
    const markup = renderToStaticMarkup(
      React.createElement(ThumbnailComponent, {
        alt: 'Photo alt text',
        filename: 'photo.jpg',
        fileSrc: '/api/media/file/photo.jpg',
        imageCacheTag: '2026-04-27T08:00:00.000Z',
        size: 'small',
      }),
    )

    expect(markup).toContain('<img')
    expect(markup).toContain('loading="lazy"')
    expect(markup).toContain('decoding="async"')
    expect(markup).toContain('alt="Photo alt text"')
    expect(markup).toContain('/api/media/file/photo.jpg?2026-04-27T08%3A00%3A00.000Z')
  })
})
