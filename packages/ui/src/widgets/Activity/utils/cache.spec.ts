import { describe, expect, it } from 'vitest'

import type { DocumentsPage } from '../types.js'
import type { ActivityDocument } from '../types.js'

import { createDocumentCache, getDocumentPage, mergeDocumentPages } from './cache.js'

const documents: ActivityDocument[] = Array.from({ length: 20 }, (_, id) => ({
  id,
  collectionSlug: 'posts',
  href: `/posts/${id}`,
  title: `Document ${id}`,
  typeLabel: 'Posts',
}))
const first: DocumentsPage = { items: documents.slice(0, 8), page: 1, totalDocs: 20 }
const second: DocumentsPage = { items: documents.slice(8, 16), page: 2, totalDocs: 20 }

describe('Dashboard document cache', () => {
  it('should page through the server overfetch without missing batches', () => {
    const page = getDocumentPage({
      cache: createDocumentCache({ page: first }),
      hasPinPlaceholder: false,
      offset: 4,
      pageSize: 4,
    })

    expect(page.items).toEqual(documents.slice(4, 8))
    expect(page.missingBatches).toEqual([])
    expect(page.currentPage).toBe(2)
  })

  it('should request only the missing batch when a page spans two batches', () => {
    const cache = createDocumentCache({ page: first })
    const before = getDocumentPage({ cache, hasPinPlaceholder: false, offset: 6, pageSize: 6 })

    expect(before.items).toBeUndefined()
    expect(before.missingBatches).toEqual([1])
    const merged = mergeDocumentPages({ cache, isReplacing: false, pages: [second] })
    const after = getDocumentPage({
      cache: merged,
      hasPinPlaceholder: false,
      offset: 6,
      pageSize: 6,
    })

    expect(after.items).toEqual(documents.slice(6, 12))
    expect(cache?.batches[1]).toBeUndefined()
  })

  it('should keep the selected document visible across page-size changes', () => {
    const cache = mergeDocumentPages({
      cache: createDocumentCache({ page: first }),
      isReplacing: false,
      pages: [second],
    })
    const resized = getDocumentPage({ cache, hasPinPlaceholder: false, offset: 12, pageSize: 7 })

    expect(resized.currentPage).toBe(2)
    expect(resized.items).toContain(documents[12])
    expect(resized.items).toEqual(documents.slice(7, 14))
  })

  it('should reserve a placeholder-only page without fetching an extra batch', () => {
    const cache = createDocumentCache({ page: { ...first, totalDocs: 8 } })
    const page = getDocumentPage({ cache, hasPinPlaceholder: true, offset: 8, pageSize: 4 })

    expect(page.currentPage).toBe(3)
    expect(page.items).toEqual([])
    expect(page.missingBatches).toEqual([])
  })

  it('should discard older batches when the server reports a changed total', () => {
    const cache = mergeDocumentPages({
      cache: createDocumentCache({ page: first }),
      isReplacing: false,
      pages: [second],
    })
    const updated = mergeDocumentPages({
      cache,
      isReplacing: false,
      pages: [{ ...second, items: documents.slice(8, 12), totalDocs: 12 }],
    })

    expect(updated.batches[0]).toBeUndefined()
    expect(updated.totalDocs).toBe(12)
    expect(cache.batches[0]).toEqual(first.items)
  })

  it('should discard invalidated batches even when the total is unchanged', () => {
    const updated = mergeDocumentPages({
      cache: createDocumentCache({ page: first }),
      isReplacing: true,
      pages: [second],
    })

    expect(updated.batches[0]).toBeUndefined()
    expect(updated.batches[1]).toEqual(second.items)
  })

  it('should clamp the visible page after documents are deleted', () => {
    const cache = createDocumentCache({
      page: { ...first, items: documents.slice(0, 4), totalDocs: 4 },
    })
    const page = getDocumentPage({ cache, hasPinPlaceholder: false, offset: 16, pageSize: 4 })

    expect(page.currentPage).toBe(1)
    expect(page.totalPages).toBe(1)
    expect(page.items).toEqual(documents.slice(0, 4))
  })
})
