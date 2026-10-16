import { describe, expect, it } from 'vitest'

import type { ActivityDocumentsPage } from '../types.js'

import { createDocumentState, documentReducer } from './state.js'

const initialPage: ActivityDocumentsPage = {
  items: [{ id: 1, collectionSlug: 'posts', href: '/posts/1', title: 'One', typeLabel: 'Posts' }],
  page: 1,
  totalDocs: 1,
}

describe('Dashboard document state', () => {
  it('should retain cached documents while a replacement is loading', () => {
    const initial = createDocumentState({ initialPage })
    const stale = documentReducer(initial, { type: 'refresh' })
    const loading = documentReducer(stale, { status: 'loading', type: 'status' })

    expect(loading.cache).toBe(initial.cache)
    expect(loading.isStale).toBe(true)
    expect(loading.status).toBe('loading')
    expect(initial.isStale).toBe(false)
  })

  it('should roll back an optimistic unpin without changing the saved cache', () => {
    const initial = createDocumentState({ initialPage })
    const removed = documentReducer(initial, { document: initialPage.items[0], type: 'remove' })
    const restored = documentReducer(removed, { cache: initial.cache, type: 'restore' })

    expect(removed.cache?.totalDocs).toBe(0)
    expect(removed.cache?.batches[0]).toEqual([])
    expect(restored.cache).toBe(initial.cache)
    expect(initial.cache?.batches[0]).toEqual(initialPage.items)
  })

  it('should replace data and clear stale state after a successful reload', () => {
    const initial = documentReducer(createDocumentState({ initialPage }), { type: 'refresh' })
    const updatedPage = { ...initialPage, items: [{ ...initialPage.items[0], title: 'Updated' }] }
    const received = documentReducer(initial, { offset: 0, pages: [updatedPage], type: 'receive' })

    expect(received.cache?.batches[0][0].title).toBe('Updated')
    expect(received.isStale).toBe(false)
    expect(received.status).toBe('idle')
  })

  it('should keep failed invalidations pending when retrying', () => {
    const stale = documentReducer(createDocumentState({ initialPage }), { type: 'refresh' })
    const failed = documentReducer(stale, { status: 'error', type: 'status' })
    const retried = documentReducer(failed, { type: 'retry' })

    expect(retried.isStale).toBe(true)
    expect(retried.cache).toBe(stale.cache)
    expect(retried.revision).toBeGreaterThan(failed.revision)
    expect(retried.status).toBe('idle')
  })

  it('should replace client state when the server supplies a new initial page', () => {
    const current = documentReducer(createDocumentState({ initialPage }), {
      offset: 8,
      type: 'show',
    })
    const updatedPage = { ...initialPage, items: [] }
    const reset = documentReducer(current, { initialPage: updatedPage, type: 'reset' })

    expect(reset.offset).toBe(0)
    expect(reset.cache?.batches[0]).toEqual([])
    expect(reset.status).toBe('idle')
  })
})
