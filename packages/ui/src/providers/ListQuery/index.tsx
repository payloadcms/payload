'use client'
import { useRouter, useSearchParams } from 'next/navigation.js'
import { type ListQuery } from 'payload'
import * as qs from 'qs-esm'
import React, { useCallback, useMemo, useRef, useState } from 'react'

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
    // Skip null, undefined, empty strings, empty arrays
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

export const ListQueryProvider: React.FC<ListQueryProps> = ({
  children,
  collectionSlug,
  data,
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

  // Parse current query from URL - this is the source of truth
  // Filter out __clear since it's just a signal param, not actual query state
  const query = useMemo<ListQuery>(() => {
    const parsed = parseSearchParams(rawSearchParams)
    delete (parsed as Record<string, unknown>).__clear
    return sanitizeQueryForURL(parsed)
  }, [rawSearchParams])

  const contextRef = useRef({} as IListQueryContext)
  contextRef.current.modified = modified

  const { onQueryChange } = useListDrawerContext()

  /**
   * Single function to update query params.
   * - Merges new params with current query
   * - Removes null/undefined values (to clear params, pass null)
   * - Updates URL via router.replace
   */
  const setQuery = useCallback(
    (newParams: Partial<ListQuery>) => {
      setModified(true)

      // Merge current query with new params
      const merged: ListQuery = { ...query, ...newParams }

      // Sanitize to remove null/undefined/empty values
      const sanitized = sanitizeQueryForURL(merged)

      if (modifySearchParams) {
        // Build URL with clean params
        // Only stringify arrays - if already a string, use as-is to avoid double-encoding
        const urlParams: Record<string, unknown> = {
          ...sanitized,
          columns: sanitized.columns
            ? Array.isArray(sanitized.columns)
              ? JSON.stringify(sanitized.columns)
              : sanitized.columns
            : undefined,
          queryByGroup: sanitized.queryByGroup
            ? typeof sanitized.queryByGroup === 'object'
              ? JSON.stringify(sanitized.queryByGroup)
              : sanitized.queryByGroup
            : undefined,
          // Always signal to server that this is a client-side navigation - don't apply preferences
          __clear: '1',
        }

        const newUrl = qs.stringify(urlParams, { addQueryPrefix: true })

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
