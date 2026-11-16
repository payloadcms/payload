import type { ActivityDocument } from '../types.js'
import type { ActivityDocumentsPage } from './getActivityWidgetDocs.js'

import { DOCUMENTS_BATCH_SIZE } from './constants.js'

/** Loaded documents of one tab, keyed by batch index. */
export type DocumentCache = {
  batches: Record<number, ActivityDocument[]>
  totalDocs: number
}

export function createDocumentCache({
  page,
}: {
  page?: ActivityDocumentsPage
}): DocumentCache | undefined {
  return (
    page && {
      batches: { [page.page - 1]: page.items },
      totalDocs: page.totalDocs,
    }
  )
}

export function mergeDocumentPages({
  cache,
  isReplacing,
  pages,
}: {
  cache?: DocumentCache
  isReplacing: boolean
  pages: ActivityDocumentsPage[]
}): DocumentCache {
  const totalDocs = pages[pages.length - 1].totalDocs
  // Cached batches are only valid for the total they were loaded with.
  const batches = isReplacing || cache?.totalDocs !== totalDocs ? {} : { ...cache.batches }

  for (const page of pages) {
    // The server clamps out-of-range pages to the last one and reports the page it returned.
    batches[page.page - 1] = page.items
  }

  return { batches, totalDocs }
}

/**
 * Pages are aligned to the page size, so a page change after a resize keeps `offset` visible.
 * `items` is `undefined` until every batch the page touches has loaded.
 */
export function getDocumentPage({
  cache,
  hasPinPlaceholder,
  offset,
  pageSize,
}: {
  cache?: DocumentCache
  hasPinPlaceholder: boolean
  offset: number
  pageSize: number
}) {
  const totalDocs = cache?.totalDocs ?? 0
  const totalPages = Math.max(1, Math.ceil((totalDocs + Number(hasPinPlaceholder)) / pageSize))
  const currentPage = Math.min(Math.floor(offset / pageSize) + 1, totalPages)
  const start = (currentPage - 1) * pageSize
  const firstBatch = Math.floor(start / DOCUMENTS_BATCH_SIZE)
  const lastBatch = cache
    ? Math.min(
        Math.floor((start + pageSize - 1) / DOCUMENTS_BATCH_SIZE),
        Math.max(0, Math.ceil(totalDocs / DOCUMENTS_BATCH_SIZE) - 1),
      )
    : firstBatch
  const missingBatches: number[] = []

  for (let batch = firstBatch; batch <= lastBatch; batch++) {
    if (!cache?.batches[batch]) {
      missingBatches.push(batch)
    }
  }

  let items: ActivityDocument[] | undefined

  if (cache && !missingBatches.length) {
    items = []
    for (let index = start; index < Math.min(start + pageSize, totalDocs); index++) {
      const item =
        cache.batches[Math.floor(index / DOCUMENTS_BATCH_SIZE)]?.[index % DOCUMENTS_BATCH_SIZE]

      if (item) {
        items.push(item)
      }
    }
  }

  return { currentPage, items, missingBatches, start, totalDocs, totalPages }
}
