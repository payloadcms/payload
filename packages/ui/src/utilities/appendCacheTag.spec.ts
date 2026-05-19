import { describe, expect, it } from 'vitest'

import { appendCacheTag } from './appendCacheTag.js'

describe('appendCacheTag', () => {
  it('should return the url unchanged when cacheTag is undefined', () => {
    expect(appendCacheTag('https://example.com/image.jpg', undefined)).toBe(
      'https://example.com/image.jpg',
    )
  })

  it('should return the url unchanged when cacheTag is false', () => {
    expect(appendCacheTag('https://example.com/image.jpg', false)).toBe(
      'https://example.com/image.jpg',
    )
  })

  it('should return the url unchanged when cacheTag is empty string', () => {
    expect(appendCacheTag('https://example.com/image.jpg', '')).toBe(
      'https://example.com/image.jpg',
    )
  })

  it('should append the cache tag with ? when the url has no query string', () => {
    const result = appendCacheTag('https://example.com/image.jpg', '2024-01-01T00:00:00.000Z')
    expect(result).toBe('https://example.com/image.jpg?2024-01-01T00%3A00%3A00.000Z')
  })

  it('should append the cache tag with & when the url already has a query string', () => {
    const result = appendCacheTag(
      'https://example.com/image.jpg?w=800&q=75',
      '2024-01-01T00:00:00.000Z',
    )
    expect(result).toBe('https://example.com/image.jpg?w=800&q=75&2024-01-01T00%3A00%3A00.000Z')
  })

  it('should URI-encode the cache tag value', () => {
    const result = appendCacheTag('/image.jpg', '2024-06-15T12:30:00.000Z')
    expect(result).toBe('/image.jpg?2024-06-15T12%3A30%3A00.000Z')
  })

  it('should work with relative urls', () => {
    const result = appendCacheTag('/uploads/photo.png', '2024-01-01T00:00:00.000Z')
    expect(result).toBe('/uploads/photo.png?2024-01-01T00%3A00%3A00.000Z')
  })

  it('should work with relative urls that already have a query string', () => {
    const result = appendCacheTag('/uploads/photo.png?size=large', '2024-01-01T00:00:00.000Z')
    expect(result).toBe('/uploads/photo.png?size=large&2024-01-01T00%3A00%3A00.000Z')
  })
})
