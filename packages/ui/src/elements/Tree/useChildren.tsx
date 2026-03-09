import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { CachedChildren, TreeCache, TreeDocument, TreeInitialData } from './types.js'

import { useConfig } from '../../providers/Config/index.js'
import { isSuperset } from '../../utilities/isSuperset.js'

type UseChildrenArgs = {
  allPossibleTypeValues?: string[]
  cache?: TreeCache
  collectionSlug: string
  enabled?: boolean
  filterByCollections?: string[]
  initialData?: null | TreeInitialData
  limit?: number
  parentFieldName: string
  parentId: number | string
  typeFieldName?: null | string
  useAsTitle?: string
}

type UseChildrenReturn = {
  children: null | TreeDocument[]
  hasMore: boolean
  isLoading: boolean
  loadMore: () => Promise<TreeDocument[]>
  refresh: () => Promise<TreeDocument[]>
  totalDocs: number
}

export const useChildren = ({
  allPossibleTypeValues,
  cache,
  collectionSlug,
  enabled = true,
  filterByCollections,
  initialData,
  limit = 2,
  parentFieldName,
  parentId,
  typeFieldName,
  useAsTitle,
}: UseChildrenArgs): UseChildrenReturn => {
  const filterKey = filterByCollections?.length ? filterByCollections.slice().sort().join(',') : ''
  const cacheKey = `${collectionSlug}-${parentId}-${filterKey}`
  const cachedData = cache?.current.get(cacheKey)

  // Check if we have initial data for this specific parent
  const parentKey = parentId === 'null' ? 'null' : String(parentId)
  const parentMeta = initialData?.loadedParents?.[parentKey]
  const hasInitialData = !!parentMeta

  // Extract docs for this parent from initialData if available
  // Apply same superset filter as fetchPage for consistency
  const initialDocsForParent = hasInitialData
    ? initialData.docs.filter((doc) => {
        const docParent = doc[parentFieldName] || 'null'
        if (String(docParent) !== parentKey) {
          return false
        }
        if (filterByCollections?.length && typeFieldName) {
          return isSuperset(doc[typeFieldName] as string[] | undefined, filterByCollections)
        }
        return true
      })
    : null

  const [children, setChildren] = useState<null | TreeDocument[]>(
    initialDocsForParent || cachedData?.children || null,
  )
  const [isLoading, setIsLoading] = useState(!hasInitialData && !cachedData && enabled)
  const [page, setPage] = useState(cachedData?.page || 1)
  const [totalDocs, setTotalDocs] = useState(parentMeta?.totalDocs || cachedData?.totalDocs || 0)
  const [hasMore, setHasMore] = useState(parentMeta?.hasMore || cachedData?.hasMore || false)
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
      currentChildren: null | TreeDocument[],
    ): Promise<TreeDocument[]> => {
      setIsLoading(true)

      try {
        const parentCondition =
          parentId === 'null' || parentId === null
            ? {
                or: [
                  { [parentFieldName]: { exists: false } },
                  { [parentFieldName]: { equals: null } },
                ],
              }
            : { [parentFieldName]: { equals: parentId } }

        // Build filter condition for collection type filtering
        // Matches items that:
        // - allow ANY of the selected collections, OR
        // - are unrestricted (type field doesn't exist), OR
        // - have empty allowedTypes array (unrestricted)
        const filterCondition =
          filterByCollections?.length && typeFieldName
            ? {
                or: [
                  { [typeFieldName]: { in: filterByCollections } },
                  { [typeFieldName]: { exists: false } },
                  // Using not_in with all possible values matches empty arrays in both MongoDB and Postgres
                  ...(allPossibleTypeValues?.length
                    ? [{ [typeFieldName]: { not_in: allPossibleTypeValues } }]
                    : []),
                ],
              }
            : null

        // Combine conditions with AND if filter is active
        const where = filterCondition
          ? { and: [parentCondition, filterCondition] }
          : parentCondition

        const queryParams: Record<string, unknown> = {
          limit,
          page: pageToFetch,
          sort: useAsTitle ?? 'id',
          where,
        }

        const queryString = qs.stringify(queryParams, { addQueryPrefix: true })
        const url = formatAdminURL({
          apiRoute: api,
          path: `/${collectionSlug}${queryString}`,
          serverURL,
        })
        const response = await fetch(url, {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Failed to fetch children')
        }

        const data = await response.json()
        const allDocs: TreeDocument[] = data.docs || []

        // Client-side filter: only show items that are a superset of required collections
        // Server query uses ANY (due to PG limitations), but we want ALL (superset)
        const newDocs =
          filterByCollections?.length && typeFieldName
            ? allDocs.filter((doc) =>
                isSuperset(doc[typeFieldName] as string[] | undefined, filterByCollections),
              )
            : allDocs

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
          const emptyChildren: TreeDocument[] = []
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
    [
      allPossibleTypeValues,
      parentId,
      filterKey,
      parentFieldName,
      filterByCollections,
      typeFieldName,
      limit,
      useAsTitle,
      api,
      collectionSlug,
      serverURL,
      cache,
      cacheKey,
    ],
  )

  // Reset state when filter changes
  const prevFilterKeyRef = useRef(filterKey)
  useEffect(() => {
    if (prevFilterKeyRef.current !== filterKey) {
      prevFilterKeyRef.current = filterKey
      setChildren(null)
      setPage(1)
      setTotalDocs(0)
      setHasMore(false)
    }
  }, [filterKey])

  useEffect(() => {
    if (!enabled) {
      return
    }

    // Skip initial fetch if we have initialData
    if (initializedRef.current && children !== null) {
      initializedRef.current = false
      return
    }

    // Restore from cache if children was reset (e.g., filter changed)
    if (cachedData && children === null) {
      setChildren(cachedData.children)
      setPage(cachedData.page)
      setTotalDocs(cachedData.totalDocs)
      setHasMore(cachedData.hasMore)
      return
    }

    if (cachedData && page === cachedData.page) {
      return
    }

    void fetchPage(page, children)
  }, [enabled, page, cachedData, fetchPage, children])

  const loadMore = useCallback(async (): Promise<TreeDocument[]> => {
    if (isLoading || !hasMore) {
      return []
    }

    // If we have fewer items than our limit, the cached data was fetched with a smaller limit
    // We need to re-fetch page 1 with our limit to get the full first page
    const shouldRefetchPage1 = children && children.length < limit

    return fetchPage(shouldRefetchPage1 ? 1 : page + 1, children)
  }, [isLoading, hasMore, page, children, fetchPage, limit])

  const refresh = useCallback(async (): Promise<TreeDocument[]> => {
    if (cache) {
      cache.current.delete(cacheKey)
    }
    setChildren(null)
    setPage(1)
    return fetchPage(1, null)
  }, [cache, cacheKey, fetchPage])

  return { children, hasMore, isLoading, loadMore, refresh, totalDocs }
}
