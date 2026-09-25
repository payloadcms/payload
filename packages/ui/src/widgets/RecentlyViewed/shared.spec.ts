import { describe, expect, it } from 'vitest'
import type { DocumentWidgetData } from './shared.js'
import { getActivityDocuments, normalizeDocumentPreferences, toggleDocumentPin } from './shared.js'

const data: DocumentWidgetData = {
  documents: [
    {
      id: 1,
      collectionSlug: 'posts',
      href: '/one',
      title: 'One',
      typeLabel: 'Posts',
      updatedAt: '2026-09-01',
    },
    {
      id: 2,
      collectionSlug: 'posts',
      href: '/two',
      title: 'Two',
      typeLabel: 'Posts',
      updatedAt: '2026-09-02',
    },
  ],
  draftKeys: ['posts:1', 'posts:2'],
  hasError: false,
  preferences: { pins: [{ id: 1, collectionSlug: 'posts' }], tab: 'recent', view: 'grid' },
  recentKeys: ['posts:1', 'posts:missing', 'posts:2', 'posts:1'],
}

describe('dashboard document preferences', () => {
  it('should discard malformed and duplicate pins while preserving numeric IDs', () => {
    expect(
      normalizeDocumentPreferences({
        value: {
          tab: 'unknown',
          view: 'unknown',
          pins: [
            null,
            {},
            { id: 1, collectionSlug: 'posts' },
            { id: '1', collectionSlug: 'posts' },
            { id: 2, collectionSlug: 'media', title: 'unused' },
          ],
        },
      }),
    ).toEqual({
      pins: [
        { id: 1, collectionSlug: 'posts' },
        { id: 2, collectionSlug: 'media' },
      ],
      tab: 'recent',
      view: 'grid',
    })
  })
  it('should unpin a numeric ID saved as a string without mutating preferences', () => {
    const pins = [{ id: '1', collectionSlug: 'posts' }]
    expect(toggleDocumentPin({ document: { id: 1, collectionSlug: 'posts' }, pins })).toEqual([])
    expect(pins).toHaveLength(1)
  })
  it('should preserve existing pins when pinning another document', () => {
    const pins = Array.from({ length: 100 }, (_, id) => ({ id, collectionSlug: 'posts' }))
    const next = toggleDocumentPin({ document: { id: 101, collectionSlug: 'posts' }, pins })
    expect(next).toHaveLength(101)
    expect(next[0].id).toBe(101)
  })
  it('should preserve recent viewing order while removing unavailable and duplicate documents', () => {
    expect(getActivityDocuments(data).map(({ id }) => id)).toEqual([1, 2])
  })
  it('should sort list dates in both directions', () => {
    const options = { ...data, preferences: { ...data.preferences, view: 'list' as const } }
    expect(getActivityDocuments(options).map(({ id }) => id)).toEqual([2, 1])
    expect(getActivityDocuments({ ...options, isAscending: true }).map(({ id }) => id)).toEqual([
      1, 2,
    ])
  })
  it('should show the newest drafts across collections first', () => {
    expect(
      getActivityDocuments({ ...data, preferences: { ...data.preferences, tab: 'drafts' } }).map(
        ({ id }) => id,
      ),
    ).toEqual([2, 1])
  })
})
