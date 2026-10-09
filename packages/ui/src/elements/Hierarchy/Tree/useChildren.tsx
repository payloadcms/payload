import type { Where } from 'payload'

import { combineWhereConstraints, formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { TreeCache, TreeDocument, TreeInitialData } from './types.js'

import { useBranchParam } from '../../../providers/Branch/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { isSuperset } from '../../../utilities/isSuperset.js'

type UseChildrenArgs = {
  allPossibleTypeValues?: string[]
  /** Base filter to apply to all queries (e.g., tenant filter) */
  baseFilter?: null | Where
  cache?: TreeCache
  /** Pre-computed cache key to ensure consistency with cache population */
  cacheKey?: string
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
  /** Explicitly load children. Safe to call multiple times — no-ops if already loaded. */
  load: () => Promise<TreeDocument[]>
  loadMore: () => Promise<TreeDocument[]>
  refresh: () => Promise<TreeDocument[]>
  totalDocs: number
}

export const getBranchAwareChildrenCacheKey = ({
  branch,
  cacheKey,
}: {
  branch?: string
  cacheKey: string
}): string => JSON.stringify([branch ?? null, cacheKey])

export const useChildren = ({
  allPossibleTypeValues,
  baseFilter,
  cache,
  cacheKey: cacheKeyProp,
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
  const branch = useBranchParam()
  const filterKey = filterByCollections?.length ? filterByCollections.slice().sort().join(',') : ''
  const baseFilterKey = baseFilter ? JSON.stringify(baseFilter) : ''
  // Use provided cacheKey for consistency with cache population, or compute if not provided
  const cacheKeyWithoutBranch =
    cacheKeyProp ?? `${collectionSlug}-${String(parentId)}-${filterKey}-${baseFilterKey}`
  const cacheKey = getBranchAwareChildrenCacheKey({ branch, cacheKey: cacheKeyWithoutBranch })
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
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(cachedData?.page || 1)
  const [totalDocs, setTotalDocs] = useState(parentMeta?.totalDocs || cachedData?.totalDocs || 0)
  const [hasMore, setHasMore] = useState(parentMeta?.hasMore || cachedData?.hasMore || false)
  const initializedRef = useRef(!!hasInitialData)
  const activeCacheKeyRef = useRef(cacheKey)
  activeCacheKeyRef.current = cacheKey
  const stateCacheKeyRef = useRef(cacheKey)
  const stateFilterKeyRef = useRef(filterKey)
  // Refs for stable access inside load() without adding state to its dep array
  const childrenRef = useRef(children)
  childrenRef.current = stateCacheKeyRef.current === cacheKey ? children : null
  const isLoadingRef = useRef(isLoading)
  isLoadingRef.current = isLoading
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
      if (activeCacheKeyRef.current === cacheKey) {
        setIsLoading(true)
      }

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
        const filterCondition: undefined | Where =
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
            : undefined

        // Combine conditions: parent + filter + baseFilter
        const where = combineWhereConstraints([parentCondition, filterCondition, baseFilter])

        const queryParams: Record<string, unknown> = {
          branch,
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

        if (cache) {
          cache.current.set(cacheKey, {
            children: newChildren,
            hasMore: data.hasNextPage || false,
            page: pageToFetch,
            totalDocs: data.totalDocs || 0,
          })
        }

        if (activeCacheKeyRef.current === cacheKey) {
          setChildren(newChildren)
          setTotalDocs(data.totalDocs || 0)
          setHasMore(data.hasNextPage || false)
          setPage(pageToFetch)
        }

        return newDocs
      } catch {
        if (pageToFetch === 1) {
          const emptyChildren: TreeDocument[] = []

          if (cache) {
            cache.current.set(cacheKey, {
              children: emptyChildren,
              hasMore: false,
              page: 1,
              totalDocs: 0,
            })
          }

          if (activeCacheKeyRef.current === cacheKey) {
            setChildren(emptyChildren)
            setHasMore(false)
          }
        }

        return []
      } finally {
        if (activeCacheKeyRef.current === cacheKey) {
          setIsLoading(false)
        }
      }
    },
    [
      branch,
      allPossibleTypeValues,
      baseFilter,
      parentId,
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

  // Reset state whenever the cache identity changes, including branch and filter changes.
  useEffect(() => {
    const hasFilterChanged = stateFilterKeyRef.current !== filterKey

    if (stateCacheKeyRef.current !== cacheKey || hasFilterChanged) {
      stateCacheKeyRef.current = cacheKey
      stateFilterKeyRef.current = filterKey
      initializedRef.current = false

      if (hasFilterChanged) {
        cache?.current.delete(cacheKey)
      }

      const cachedDataForActiveBranch = hasFilterChanged ? undefined : cache?.current.get(cacheKey)
      const nextChildren = enabled ? (cachedDataForActiveBranch?.children ?? null) : null

      childrenRef.current = nextChildren
      isLoadingRef.current = false
      setChildren(nextChildren)
      setIsLoading(false)
      setPage(enabled ? (cachedDataForActiveBranch?.page ?? 1) : 1)
      setTotalDocs(enabled ? (cachedDataForActiveBranch?.totalDocs ?? 0) : 0)
      setHasMore(enabled ? (cachedDataForActiveBranch?.hasMore ?? false) : false)

      if (enabled && !cachedDataForActiveBranch) {
        void fetchPage(1, null)
      }
    }
  }, [cache, cacheKey, enabled, fetchPage, filterKey])

  // Load children explicitly. Safe to call multiple times — no-ops if already loaded or loading.
  const load = useCallback(async (): Promise<TreeDocument[]> => {
    // Consume initialData on first call without re-fetching
    if (initializedRef.current && childrenRef.current !== null) {
      initializedRef.current = false
      return childrenRef.current
    }

    // Already loaded
    if (childrenRef.current !== null) {
      return childrenRef.current
    }

    // Guard against concurrent calls
    if (isLoadingRef.current) {
      return []
    }

    // Restore from cache when available (e.g., after a filter reset)
    const currentCachedData = cache?.current.get(cacheKey)
    if (currentCachedData) {
      setChildren(currentCachedData.children)
      setPage(currentCachedData.page)
      setTotalDocs(currentCachedData.totalDocs)
      setHasMore(currentCachedData.hasMore)
      return currentCachedData.children
    }

    return fetchPage(1, null)
  }, [cache, cacheKey, fetchPage])

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
  // If state hasn't been loaded yet, read directly from cache as a synchronous fallback.
  // Tree's useMemo pre-populates the cache before child TreeNodes render, so this eliminates
  // the brief null-children flash that occurs when a node becomes expanded after context updates.
  const effectiveChildren =
    stateCacheKeyRef.current === cacheKey
      ? (children ?? cache?.current.get(cacheKey)?.children ?? null)
      : null

  return { children: effectiveChildren, hasMore, isLoading, load, loadMore, refresh, totalDocs }
}
