'use client'
import { dequal } from 'dequal/lite'
import { useRouter, useSearchParams } from 'next/navigation.js'
import { type ListQuery, type Where } from 'payload'
import { isNumber, transformColumnsToSearchParams } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { IListQueryContext, ListQueryProps } from './types.js'

import { useListDrawerContext } from '../../elements/ListDrawer/Provider.js'
import { useEffectEvent } from '../../hooks/useEffectEvent.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { parseSearchParams } from '../../utilities/parseSearchParams.js'
import { ListQueryContext, ListQueryModifiedContext } from './context.js'
import { mergeQuery } from './mergeQuery.js'

export { useListQuery } from './context.js'

export const ListQueryProvider: React.FC<ListQueryProps> = ({
  children,
  collectionSlug,
  columns,
  data,
  defaultLimit,
  defaultSort,
  listPreferences,
  modifySearchParams,
  onQueryChange: onQueryChangeFromProps,
  orderableFieldName,
}) => {
  // eslint-disable-next-line react-compiler/react-compiler
  'use no memo'
  // TODO: Investigate if this is still needed

  const router = useRouter()
  const rawSearchParams = useSearchParams()
  const { startRouteTransition } = useRouteTransition()
  const [modified, setModified] = useState(false)

  const searchParams = useMemo<ListQuery>(
    () => parseSearchParams(rawSearchParams),
    [rawSearchParams],
  )

  const contextRef = useRef({} as IListQueryContext)

  contextRef.current.modified = modified

  const { onQueryChange } = useListDrawerContext()

  const [currentQuery, setCurrentQuery] = useState<ListQuery>(() => {
    if (modifySearchParams) {
      return searchParams
    } else {
      return {
        limit: String(defaultLimit),
        sort: defaultSort,
      }
    }
  })

  const refineListData = useCallback(
    // eslint-disable-next-line @typescript-eslint/require-await
    async (incomingQuery: ListQuery, modified?: boolean) => {
      if (modified !== undefined) {
        setModified(modified)
      } else {
        setModified(true)
      }

      const newQuery = mergeQuery(currentQuery, incomingQuery, {
        defaults: {
          limit: defaultLimit?.toString(),
          sort: defaultSort,
        },
      })

      if (modifySearchParams) {
        startRouteTransition(() =>
          router.replace(
            `${qs.stringify({ ...newQuery, columns: JSON.stringify(newQuery.columns) }, { addQueryPrefix: true })}`,
          ),
        )
      } else if (
        typeof onQueryChange === 'function' ||
        typeof onQueryChangeFromProps === 'function'
      ) {
        const onChangeFn = onQueryChange || onQueryChangeFromProps
        onChangeFn(newQuery)
      }

      setCurrentQuery(newQuery)
    },
    [
      currentQuery,
      defaultLimit,
      defaultSort,
      modifySearchParams,
      onQueryChange,
      onQueryChangeFromProps,
      startRouteTransition,
      router,
    ],
  )

  const handlePageChange = useCallback(
    async (page: number) => {
      // same thing here
      await refineListData({ page: String(page) })
    },
    [refineListData],
  )

  const handlePerPageChange = React.useCallback(
    async (limit: number) => {
      // Same thing here
      await refineListData({ limit: String(limit), page: '1' })
    },
    [refineListData],
  )

  const handleSearchChange = useCallback(
    async (arg: string) => {
      const search = arg === '' ? undefined : arg
      await refineListData({ search })
    },
    [refineListData],
  )

  const handleSortChange = useCallback(
    async (sort: string) => {
      await refineListData({ sort })
    },
    [refineListData],
  )

  const handleWhereChange = useCallback(
    async (where: Where) => {
      await refineListData({ where })
    },
    [refineListData],
  )

  const syncQuery = useEffectEvent(() => {
    let shouldUpdateQueryString = false

    const newQuery = { ...(currentQuery || {}) }

    // Allow the URL to override the default `limit`
    // i.e. only apply the `defaultLimit` if there is no limit in the URL
    if (isNumber(defaultLimit) && !('limit' in currentQuery)) {
      newQuery.limit = String(defaultLimit)
      shouldUpdateQueryString = true
    }

    // Allow the URL to override the default `sort`
    // i.e. only apply the `defaultSort` if there is no sort in the URL
    if (defaultSort && !('sort' in currentQuery)) {
      newQuery.sort = defaultSort
      shouldUpdateQueryString = true
    }

    if (listPreferences?.groupBy && !('groupBy' in currentQuery)) {
      newQuery.groupBy = listPreferences.groupBy
      shouldUpdateQueryString = true
    }

    if (listPreferences?.preset && !('preset' in currentQuery)) {
      newQuery.preset = listPreferences.preset
      shouldUpdateQueryString = true
    }

    // Iterate through `newQuery` and remove all empty strings
    // This is how we know to clear them from preferences on the server, but are no longer needed
    Object.entries(newQuery).forEach(([key, value]) => {
      if (value === '') {
        newQuery[key] = undefined
        shouldUpdateQueryString = true
      }
    })

    // Only modify columns if they originated from preferences
    // We can assume they did if `listPreferences.columns` is defined
    if (columns && listPreferences?.columns && !('columns' in currentQuery)) {
      newQuery.columns = transformColumnsToSearchParams(columns)
      shouldUpdateQueryString = true
    }

    if (shouldUpdateQueryString) {
      setCurrentQuery(newQuery)
      // Do not use router.replace here to avoid re-rendering on initial load
      window.history.replaceState(
        null,
        '',
        `?${qs.stringify({ ...newQuery, columns: JSON.stringify(newQuery.columns) })}`,
      )
    }
  })

  // If `defaultLimit` or `defaultSort` are updated externally, update the query
  // I.e. when HMR runs, these properties may be different
  useEffect(() => {
    if (modifySearchParams) {
      syncQuery()
    }
  }, [defaultSort, defaultLimit, modifySearchParams, columns])

  return (
    <ListQueryContext
      value={{
        collectionSlug,
        data,
        handlePageChange,
        handlePerPageChange,
        handleSearchChange,
        handleSortChange,
        handleWhereChange,
        orderableFieldName,
        query: currentQuery,
        refineListData,
        setModified,
        ...contextRef.current,
      }}
    >
      <ListQueryModifiedContext value={modified}>{children}</ListQueryModifiedContext>
    </ListQueryContext>
  )
}
