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
  // TODO: Investigate if this is still needed
  // eslint-disable-next-line react-compiler/react-compiler
  'use no memo'
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

  const mergeQuery = useCallback(
    (newQuery: ListQuery = {}): ListQuery => {
      let page = 'page' in newQuery ? newQuery.page : currentQuery?.page

      if ('where' in newQuery || 'search' in newQuery) {
        page = 1
      }

      const mergedQuery: ListQuery = {
        ...currentQuery,
        ...newQuery,
        columns: 'columns' in newQuery ? newQuery.columns : currentQuery.columns,
        limit: 'limit' in newQuery ? newQuery.limit : (currentQuery?.limit ?? queryFromProps.limit),
        page,
        preset: 'preset' in newQuery ? newQuery.preset : currentQuery?.preset,
        search: 'search' in newQuery ? newQuery.search : currentQuery?.search,
        sort:
          'sort' in newQuery
            ? newQuery.sort
            : ((currentQuery?.sort as string) ?? queryFromProps.sort),
        where: 'where' in newQuery ? newQuery.where : currentQuery?.where,
      }

      return mergedQuery
    },
    [currentQuery, queryFromProps],
  )

  const refineListData = useCallback(
    // eslint-disable-next-line @typescript-eslint/require-await
    async (incomingQuery: ListQuery, modified?: boolean) => {
      if (modified !== undefined) {
        setModified(modified)
      } else {
        setModified(true)
      }

      const newQuery = mergeQuery(incomingQuery)

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
      mergeQuery,
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

  const syncQueryFromPropsToURL = useEffectEvent(() => {
    const newQuery = { ...(currentQuery || {}), ...(queryFromProps || {}) }

    Object.entries(newQuery).forEach(([key, value]) => {
      // Sanitize empty arrays from the query, see note below
      if (key === 'columns' && Array.isArray(newQuery[key]) && newQuery[key].length === 0) {
        newQuery[key] = undefined
      }

      // Sanitize empty strings from the query
      // This is how we determine whether to clear user preferences for certain params, e.g. `?preset=`
      // Once cleared, they are no longer needed in the URL
      if (value === '') {
        newQuery[key] = undefined
      }
    })

    setCurrentQuery(newQuery)

    // Do not use router.replace here to avoid re-rendering on initial load
    window.history.replaceState(
      null,
      '',
      `?${qs.stringify({ ...newQuery, columns: JSON.stringify(newQuery.columns) })}`,
    )
  })

  // If `query` is updated externally, update the local state
  // I.e. when HMR runs, these properties may be different
  useEffect(() => {
    if (modifySearchParams) {
      syncQueryFromPropsToURL()
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
