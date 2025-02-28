'use client'
import { useRouter, useSearchParams } from 'next/navigation.js'
import { type ListQuery, type Where } from 'payload'
import { isNumber, transformColumnsToSearchParams } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import type { ListQueryProps } from './types.js'

import { useListDrawerContext } from '../../elements/ListDrawer/Provider.js'
import { useEffectEvent } from '../../hooks/useEffectEvent.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { parseSearchParams } from '../../utilities/parseSearchParams.js'
import { ListQueryContext } from './context.js'

export { useListQuery } from './context.js'

export const ListQueryProvider: React.FC<ListQueryProps> = ({
  children,
  columns,
  data,
  defaultLimit,
  defaultSort,
  listPreferences,
  modifySearchParams,
  onQueryChange: onQueryChangeFromProps,
}) => {
  'use no memo'
  const router = useRouter()
  const rawSearchParams = useSearchParams()
  const { startRouteTransition } = useRouteTransition()

  const searchParams = useMemo<ListQuery>(
    () => parseSearchParams(rawSearchParams),
    [rawSearchParams],
  )

  const { onQueryChange } = useListDrawerContext()

  const [currentQuery, setCurrentQuery] = useState<ListQuery>(() => {
    if (modifySearchParams) {
      return searchParams
    } else {
      return {}
    }
  })

  // If the search params change externally, update the current query
  useEffect(() => {
    if (modifySearchParams) {
      setCurrentQuery(searchParams)
    }
  }, [searchParams, modifySearchParams])

  const refineListData = useCallback(
    // eslint-disable-next-line @typescript-eslint/require-await
    async (query: ListQuery) => {
      let page = 'page' in query ? query.page : currentQuery?.page

      if ('where' in query || 'search' in query) {
        page = '1'
      }

      const newQuery: ListQuery = {
        columns: 'columns' in query ? query.columns : currentQuery.columns,
        limit: 'limit' in query ? query.limit : (currentQuery?.limit ?? String(defaultLimit)),
        page,
        search: 'search' in query ? query.search : currentQuery?.search,
        sort: 'sort' in query ? query.sort : ((currentQuery?.sort as string) ?? defaultSort),
        where: 'where' in query ? query.where : currentQuery?.where,
      }

      if (modifySearchParams) {
        startRouteTransition(() =>
          router.replace(
            `${qs.stringify(
              { ...newQuery, columns: JSON.stringify(newQuery.columns) },
              { addQueryPrefix: true },
            )}`,
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
      currentQuery?.columns,
      currentQuery?.limit,
      currentQuery?.page,
      currentQuery?.search,
      currentQuery?.sort,
      currentQuery?.where,
      startRouteTransition,
      defaultLimit,
      defaultSort,
      modifySearchParams,
      onQueryChange,
      onQueryChangeFromProps,
      router,
    ],
  )

  const handlePageChange = useCallback(
    async (arg: number) => {
      await refineListData({ page: String(arg) })
    },
    [refineListData],
  )

  const handlePerPageChange = React.useCallback(
    async (arg: number) => {
      await refineListData({ limit: String(arg), page: '1' })
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
    async (arg: string) => {
      await refineListData({ sort: arg })
    },
    [refineListData],
  )

  const handleWhereChange = useCallback(
    async (arg: Where) => {
      await refineListData({ where: arg })
    },
    [refineListData],
  )

  const syncQuery = useEffectEvent(() => {
    let shouldUpdateQueryString = false
    const newQuery = { ...(currentQuery || {}) }

    // Allow the URL to override the default limit
    if (isNumber(defaultLimit) && !('limit' in currentQuery)) {
      newQuery.limit = String(defaultLimit)
      shouldUpdateQueryString = true
    }

    // Allow the URL to override the default sort
    if (defaultSort && !('sort' in currentQuery)) {
      newQuery.sort = defaultSort
      shouldUpdateQueryString = true
    }

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
    <ListQueryContext.Provider
      value={{
        data,
        handlePageChange,
        handlePerPageChange,
        handleSearchChange,
        handleSortChange,
        handleWhereChange,
        query: currentQuery,
        refineListData,
      }}
    >
      {children}
    </ListQueryContext.Provider>
  )
}
