import type { HierarchyContents, HierarchyContentsSource } from 'payload'

import { describe, expect, it } from 'vitest'

import type { HierarchyContentsBranch } from './state.js'

import { mergeHierarchyContentsPage } from './state.js'

const source = ({
  collectionSlug,
  docs,
  hasNextPage = true,
  page = 1,
}: {
  collectionSlug: string
  docs: HierarchyContentsSource['docs']
  hasNextPage?: boolean
  page?: number
}): HierarchyContentsSource => ({
  collectionSlug,
  docs,
  hasNextPage,
  page,
  totalDocs: 20,
  totalPages: 2,
})

const branch = ({
  sources,
}: {
  sources: HierarchyContents['sources']
}): HierarchyContentsBranch => ({
  errors: [],
  pending: [],
  sources,
})

describe('hierarchy contents branch pages', () => {
  it('should append one collection without mixing documents that share IDs across collections', () => {
    const pages = source({ collectionSlug: 'pages', docs: [{ id: 0, title: 'Page' }] })
    const articles = source({ collectionSlug: 'articles', docs: [{ id: 0, title: 'Article' }] })
    const previous = branch({ sources: [pages, articles] })
    const next = source({
      collectionSlug: 'pages',
      docs: [{ id: 1, title: 'Another page' }],
      hasNextPage: false,
      page: 2,
    })
    const merged = mergeHierarchyContentsPage({
      branch: previous,
      result: { parentID: 0, sources: [next] },
      source: 'pages',
    })

    expect(merged.sources[0].docs.map(({ title }) => title)).toEqual(['Page', 'Another page'])
    expect(merged.sources[0].page).toBe(2)
    expect(merged.sources[0].hasNextPage).toBe(false)
    expect(merged.sources[1]).toBe(articles)
    expect(previous.sources[0].docs).toHaveLength(1)
  })

  it('should refresh duplicate document metadata while preserving its position', () => {
    const merged = mergeHierarchyContentsPage({
      branch: branch({
        sources: [source({ collectionSlug: 'pages', docs: [{ id: 1, title: 'Old' }, { id: 2 }] })],
      }),
      result: {
        parentID: null,
        sources: [
          source({
            collectionSlug: 'pages',
            docs: [{ id: 1, _isLocked: true, title: 'Updated' }, { id: 3 }],
            page: 2,
          }),
        ],
      },
      source: 'pages',
    })

    expect(merged.sources[0].docs.map(({ id }) => id)).toEqual([1, 2, 3])
    expect(merged.sources[0].docs[0]).toEqual({ id: 1, _isLocked: true, title: 'Updated' })
  })

  it('should stop paging a source omitted by the authorized response', () => {
    const merged = mergeHierarchyContentsPage({
      branch: branch({ sources: [source({ collectionSlug: 'pages', docs: [{ id: 1 }] })] }),
      result: { parentID: null, sources: [] },
      source: 'pages',
    })

    expect(merged.sources[0].hasNextPage).toBe(false)
  })

  it('should replace a complete branch snapshot without retaining removed sources', () => {
    const articles = source({ collectionSlug: 'articles', docs: [{ id: 2 }] })
    const merged = mergeHierarchyContentsPage({
      branch: branch({ sources: [source({ collectionSlug: 'pages', docs: [{ id: 1 }] })] }),
      result: { allowedCollections: [], parentID: 0, sources: [articles] },
    })

    expect(merged.sources).toEqual([articles])
    expect(merged.allowedCollections).toEqual([])
  })

  it('should discard an old allowed-type hint when the next response cannot provide it', () => {
    const merged = mergeHierarchyContentsPage({
      branch: { ...branch({ sources: [] }), allowedCollections: ['pages'] },
      result: { parentID: 0, sources: [] },
    })

    expect(merged.allowedCollections).toBeUndefined()
  })
})
