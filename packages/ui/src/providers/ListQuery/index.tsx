'use client'
import type { ColumnPreference, ListQuery, Where } from 'payload'

import { useRouter, useSearchParams } from 'next/navigation.js'
import { isNumber } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import type { ListQueryProps } from './types.js'

import { useListDrawerContext } from '../../elements/ListDrawer/Provider.js'
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
  modifySearchParams,
  onQueryChange: onQueryChangeFromProps,
}) => {
  'use no memo'
  const router = useRouter()
  const rawSearchParams = useSearchParams()
  const { startRouteTransition } = useRouteTransition()

  const searchParams = useMemo<ListQuery>(() => {
    const parsed = parseSearchParams(rawSearchParams)
    const result: ListQuery = parsed

    if (parsed.columns) {
      result.columns = JSON.parse(parsed.columns as string) as ColumnPreference[]
    }

    return result
  }, [rawSearchParams])

  const { onQueryChange } = useListDrawerContext()

  const [currentQuery, setCurrentQuery] = useState<ListQuery>(() => {
    if (modifySearchParams) {
      return searchParams
    } else {
      return {}
    }
  })

  const currentQueryRef = React.useRef(currentQuery)

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

  // If `defaultLimit` or `defaultSort` are updated externally, update the query
  // I.e. when HMR runs, these properties may be different
  useEffect(() => {
    if (modifySearchParams) {
      let shouldUpdateQueryString = false
      const newQuery = { ...(currentQueryRef.current || {}) }

      // Allow the URL to override the default limit
      if (isNumber(defaultLimit) && !('limit' in currentQueryRef.current)) {
        newQuery.limit = String(defaultLimit)
        shouldUpdateQueryString = true
      }

      // Allow the URL to override the default sort
      if (defaultSort && !('sort' in currentQueryRef.current)) {
        newQuery.sort = defaultSort
        shouldUpdateQueryString = true
      }

      if (columns && !('columns' in currentQueryRef.current)) {
        newQuery.columns = columns
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
    }
  }, [defaultSort, defaultLimit, router, modifySearchParams, columns])

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
