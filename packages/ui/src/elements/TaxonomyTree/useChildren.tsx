import { useCallback, useEffect, useRef, useState } from 'react'

import type { TaxonomyDocument, TaxonomyInitialData } from './types.js'

import { useConfig } from '../../providers/Config/index.js'

type UseChildrenArgs = {
  cache?: React.MutableRefObject<Map<string, CachedChildren>>
  collectionSlug: string
  enabled?: boolean
  initialData?: null | TaxonomyInitialData
  limit?: number
  parentFieldName: string
  parentId: number | string
}

type CachedChildren = {
  children: TaxonomyDocument[]
  hasMore: boolean
  page: number
  totalDocs: number
}

type UseChildrenReturn = {
  children: null | TaxonomyDocument[]
  hasMore: boolean
  isLoading: boolean
  loadMore: () => Promise<TaxonomyDocument[]>
  totalDocs: number
}

export const useChildren = ({
  cache,
  collectionSlug,
  enabled = true,
  initialData,
  limit = 2,
  parentFieldName,
  parentId,
}: UseChildrenArgs): UseChildrenReturn => {
  const cacheKey = `${collectionSlug}-${parentId}`
  const cachedData = cache?.current.get(cacheKey)

  // Check if we have initial data (only for root nodes with parentId === 'null')
  const hasInitialData = initialData && parentId === 'null'

  const [children, setChildren] = useState<null | TaxonomyDocument[]>(
    hasInitialData ? initialData.docs : cachedData?.children || null,
  )
  const [isLoading, setIsLoading] = useState(!hasInitialData && !cachedData && enabled)
  const [page, setPage] = useState(cachedData?.page || 1)
  const [totalDocs, setTotalDocs] = useState(
    hasInitialData ? initialData.docs.length : cachedData?.totalDocs || 0,
  )
  const [hasMore, setHasMore] = useState(cachedData?.hasMore || false)
  const initializedRef = useRef(!!hasInitialData)
  const {
    config: {
      routes: { api },
      serverURL,
    },
  } = useConfig()

  const fetchPage = useCallback(
    async (
      pageToFetch: number,
      currentChildren: null | TaxonomyDocument[],
    ): Promise<TaxonomyDocument[]> => {
      setIsLoading(true)

      try {
        const whereClause =
          parentId === 'null' || parentId === null
            ? `where[${parentFieldName}][exists]=false`
            : `where[${parentFieldName}][equals]=${parentId}`

        const url = `${serverURL}${api}/${collectionSlug}?${whereClause}&limit=${limit}&page=${pageToFetch}`
        const response = await fetch(url, {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Failed to fetch children')
        }

        const data = await response.json()
        const newDocs = data.docs || []
        const newChildren = pageToFetch === 1 ? newDocs : [...(currentChildren || []), ...newDocs]

        setChildren(newChildren)
        setTotalDocs(data.totalDocs || 0)
        setHasMore(data.hasNextPage || false)
        setPage(pageToFetch)

        if (cache) {
          cache.current.set(cacheKey, {
            children: newChildren,
            hasMore: data.hasNextPage || false,
            page: pageToFetch,
            totalDocs: data.totalDocs || 0,
          })
        }

        return newDocs
      } catch {
        if (pageToFetch === 1) {
          const emptyChildren: TaxonomyDocument[] = []
          setChildren(emptyChildren)
          setHasMore(false)

          if (cache) {
            cache.current.set(cacheKey, {
              children: emptyChildren,
              hasMore: false,
              page: 1,
              totalDocs: 0,
            })
          }
        }

        return []
      } finally {
        setIsLoading(false)
      }
    },
    [parentId, parentFieldName, serverURL, api, collectionSlug, limit, cache, cacheKey],
  )

  useEffect(() => {
    if (!enabled) {
      return
    }

    // Skip initial fetch if we have initialData
    if (initializedRef.current && children !== null) {
      initializedRef.current = false
      return
    }

    if (cachedData && page === cachedData.page) {
      return
    }

    void fetchPage(page, children)
  }, [enabled, page, cachedData, fetchPage, children])

  const loadMore = useCallback(async (): Promise<TaxonomyDocument[]> => {
    if (isLoading || !hasMore) {
      return []
    }

    return fetchPage(page + 1, children)
  }, [isLoading, hasMore, page, children, fetchPage])

  return { children, hasMore, isLoading, loadMore, totalDocs }
}
