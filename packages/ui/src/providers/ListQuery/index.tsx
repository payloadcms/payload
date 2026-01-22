'use client'
import type { ListQuery } from 'payload'

import { useRouter, useSearchParams } from 'next/navigation.js'
import * as qs from 'qs-esm'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { IListQueryContext, ListQueryProps } from './types.js'

import { useListDrawerContext } from '../../elements/ListDrawer/Provider.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { parseSearchParams } from '../../utilities/parseSearchParams.js'
import { useConfig } from '../Config/index.js'
import { ListQueryContext, ListQueryModifiedContext } from './context.js'

export { useListQuery } from './context.js'

/**
 * Sanitize query by removing null, undefined, and empty values.
 * This ensures clean URLs without floating empty params.
 */
function sanitizeQueryForURL(query: ListQuery): ListQuery {
  const sanitized: ListQuery = {}

  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === '') {
      continue
    }
    if (Array.isArray(value) && value.length === 0) {
      continue
    }
    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) {
      continue
    }
    ;(sanitized as Record<string, unknown>)[key] = value
  }

  return sanitized
}

/**
 * Build URL search string from query params
 */
function buildUrlSearch(query: ListQuery, includeClientFlag = true): string {
  const urlParams: Record<string, unknown> = {
    ...query,
    columns: query.columns
      ? Array.isArray(query.columns)
        ? JSON.stringify(query.columns)
        : query.columns
      : undefined,
    queryByGroup: query.queryByGroup
      ? typeof query.queryByGroup === 'object'
        ? JSON.stringify(query.queryByGroup)
        : query.queryByGroup
      : undefined,
  }

  if (includeClientFlag) {
    urlParams.__clear = '1'
  }

  return qs.stringify(urlParams, { addQueryPrefix: true })
}

export const ListQueryProvider: React.FC<ListQueryProps> = ({
  children,
  collectionSlug,
  data,
  initialParams,
  modifySearchParams,
  onQueryChange: onQueryChangeFromProps,
  orderableFieldName,
}) => {
  const router = useRouter()
  const rawSearchParams = useSearchParams()
  const { startRouteTransition } = useRouteTransition()
  const [modified, setModified] = useState(false)
  const { getEntityConfig } = useConfig()
  const collectionConfig = getEntityConfig({ collectionSlug })
  const hasSyncedInitialParams = useRef(false)

  // Parse current query from URL (filter out __clear signal param)
  const urlQuery = useMemo<ListQuery>(() => {
    const parsed = parseSearchParams(rawSearchParams)
    delete (parsed as Record<string, unknown>).__clear
    return sanitizeQueryForURL(parsed)
  }, [rawSearchParams])

  // Merge URL query with initial params from server
  // Initial params are used when URL has no params (first load with preferences)
  const query = useMemo<ListQuery>(() => {
    const urlHasParams = Object.keys(urlQuery).length > 0
    if (urlHasParams || !initialParams) {
      return urlQuery
    }
    return sanitizeQueryForURL(initialParams)
  }, [urlQuery, initialParams])

  // Sync initial params to URL on mount (without causing navigation/refresh)
  useEffect(() => {
    if (
      !hasSyncedInitialParams.current &&
      modifySearchParams &&
      initialParams &&
      Object.keys(urlQuery).length === 0 &&
      typeof window !== 'undefined'
    ) {
      hasSyncedInitialParams.current = true
      const sanitized = sanitizeQueryForURL(initialParams)
      if (Object.keys(sanitized).length > 0) {
        const newUrl = buildUrlSearch(sanitized, false)
        window.history.replaceState(window.history.state, '', newUrl)
      }
    }
  }, [initialParams, modifySearchParams, urlQuery])

  const contextRef = useRef({} as IListQueryContext)
  contextRef.current.modified = modified

  const { onQueryChange } = useListDrawerContext()

  /**
   * Update query params.
   * - Merges new params with current query
   * - Removes null/undefined values (pass null to clear a param)
   * - Updates URL via router.replace
   * - Resets page to 1 when filters change
   */
  const setQuery = useCallback(
    (newParams: Partial<ListQuery>) => {
      setModified(true)

      const merged: ListQuery = { ...query, ...newParams }

      // Reset page when filters change
      if ('where' in newParams || 'sort' in newParams || 'search' in newParams) {
        merged.page = 1
      }

      const sanitized = sanitizeQueryForURL(merged)

      if (modifySearchParams) {
        const newUrl = buildUrlSearch(sanitized)
        startRouteTransition(() => router.replace(newUrl))
      } else if (
        typeof onQueryChange === 'function' ||
        typeof onQueryChangeFromProps === 'function'
      ) {
        const onChangeFn = onQueryChange || onQueryChangeFromProps
        onChangeFn(sanitized)
      }
    },
    [
      query,
      modifySearchParams,
      onQueryChange,
      onQueryChangeFromProps,
      startRouteTransition,
      router,
    ],
  )

  /**
   * @deprecated Use `setQuery({ page: number })` instead
   */
  const handlePageChange = useCallback(
    (page: number) => {
      setQuery({ page })
    },
    [setQuery],
  )

  /**
   * @deprecated Use `setQuery({ limit: number })` instead
   */
  const handlePerPageChange = useCallback(
    (limit: number) => {
      setQuery({ limit })
    },
    [setQuery],
  )

  return (
    <ListQueryContext
      value={{
        collectionSlug,
        data,
        defaultLimit: data?.limit,
        handlePageChange,
        handlePerPageChange,
        isGroupingBy: Boolean(collectionConfig?.admin?.groupBy && query?.groupBy),
        orderableFieldName,
        query,
        setModified,
        setQuery,
        ...contextRef.current,
      }}
    >
      <ListQueryModifiedContext value={modified}>{children}</ListQueryModifiedContext>
    </ListQueryContext>
  )
}
