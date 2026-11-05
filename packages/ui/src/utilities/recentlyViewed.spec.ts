import type { RecentlyViewedItem } from 'payload'

import { describe, expect, it } from 'vitest'

import { addRecentlyViewedItem, recentlyViewedMaxItems } from './recentlyViewed.js'

const item = (
  collectionSlug: string,
  id: number | string,
  viewedAt: string,
): RecentlyViewedItem => ({
  collectionSlug,
  id,
  viewedAt,
})

describe('addRecentlyViewedItem', () => {
  it('should create the list when there are no existing preferences', () => {
    const next = item('posts', 1, '2026-01-01T00:00:00.000Z')

    const result = addRecentlyViewedItem({ existing: undefined, item: next })

    expect(result.items).toEqual([next])
  })

  it('should prepend the newly viewed document', () => {
    const existing = { items: [item('posts', 1, '2026-01-01T00:00:00.000Z')] }
    const next = item('pages', 2, '2026-01-02T00:00:00.000Z')

    const result = addRecentlyViewedItem({ existing, item: next })

    expect(result.items.map((i) => i.id)).toEqual([2, 1])
  })

  it('should move an already-viewed document to the front and refresh its timestamp', () => {
    const existing = {
      items: [
        item('pages', 2, '2026-01-02T00:00:00.000Z'),
        item('posts', 1, '2026-01-01T00:00:00.000Z'),
      ],
    }
    const next = item('posts', 1, '2026-01-03T00:00:00.000Z')

    const result = addRecentlyViewedItem({ existing, item: next })

    expect(result.items).toEqual([next, item('pages', 2, '2026-01-02T00:00:00.000Z')])
  })

  it('should treat numeric and string ids consistently when deduping', () => {
    const existing = { items: [item('posts', 1, '2026-01-01T00:00:00.000Z')] }
    const next = item('posts', '1', '2026-01-02T00:00:00.000Z')

    const result = addRecentlyViewedItem({ existing, item: next })

    expect(result.items).toHaveLength(1)
    expect(result.items[0]).toEqual(next)
  })

  it('should not dedupe documents with the same id across different collections', () => {
    const existing = { items: [item('posts', 1, '2026-01-01T00:00:00.000Z')] }
    const next = item('pages', 1, '2026-01-02T00:00:00.000Z')

    const result = addRecentlyViewedItem({ existing, item: next })

    expect(result.items).toHaveLength(2)
  })

  it('should cap the list at the provided max', () => {
    const existing = {
      items: Array.from({ length: 5 }, (_, index) =>
        item('posts', index, `2026-01-0${index + 1}T00:00:00.000Z`),
      ),
    }
    const next = item('pages', 99, '2026-02-01T00:00:00.000Z')

    const result = addRecentlyViewedItem({ existing, item: next, max: 3 })

    expect(result.items).toHaveLength(3)
    expect(result.items[0]).toEqual(next)
  })

  it('should default the cap to recentlyViewedMaxItems', () => {
    const existing = {
      items: Array.from({ length: recentlyViewedMaxItems }, (_, index) =>
        item('posts', index, '2026-01-01T00:00:00.000Z'),
      ),
    }
    const next = item('pages', 99, '2026-02-01T00:00:00.000Z')

    const result = addRecentlyViewedItem({ existing, item: next })

    expect(result.items).toHaveLength(recentlyViewedMaxItems)
    expect(result.items[0]).toEqual(next)
  })
})
