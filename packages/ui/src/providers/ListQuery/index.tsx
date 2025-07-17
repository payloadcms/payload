'use client'
import { useRouter, useSearchParams } from 'next/navigation.js'
import { type ListQuery, type Where } from 'payload'
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
  data,
  modifySearchParams,
  onQueryChange: onQueryChangeFromProps,
  orderableFieldName,
  query: queryFromProps,
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
        limit: queryFromProps.limit,
        sort: queryFromProps.sort,
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
          limit: queryFromProps.limit,
          sort: queryFromProps.sort,
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
      queryFromProps,
      modifySearchParams,
      onQueryChange,
      onQueryChangeFromProps,
      startRouteTransition,
      router,
    ],
  )

  const handlePageChange = useCallback(
    async (arg: number) => {
      await refineListData({ page: arg })
    },
    [refineListData],
  )

  const handlePerPageChange = React.useCallback(
    async (arg: number) => {
      await refineListData({ limit: arg, page: 1 })
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

  const syncQueryToURL = useEffectEvent(() => {
    let shouldUpdateQueryString = false

    const newQuery = { ...(currentQuery || {}) }

    if (queryFromProps) {
      Object.entries(queryFromProps).forEach(([key, value]) => {
        if (value !== undefined && !(key in newQuery)) {
          newQuery[key] = value
          shouldUpdateQueryString = true
        }
      })
    }

    // Sanitize empty strings from the query
    // This is how we determine whether to clear user preferences for certain params, e.g. `?preset=`
    // Once cleared, they are no longer needed in the URL
    Object.entries(newQuery).forEach(([key, value]) => {
      if (value === '') {
        newQuery[key] = undefined
        shouldUpdateQueryString = true
      }
    })

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

  // If `query` is updated externally, update the local state
  // I.e. when HMR runs, these properties may be different
  useEffect(() => {
    if (modifySearchParams) {
      syncQueryToURL()
    }
  }, [modifySearchParams, queryFromProps])

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
