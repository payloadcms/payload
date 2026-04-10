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
import { useConfig } from '../Config/index.js'
import { ListQueryContext, ListQueryModifiedContext } from './context.js'
import { mergeQuery } from './mergeQuery.js'
import { sanitizeQuery } from './sanitizeQuery.js'

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
  'use no memo'

  const router = useRouter()
  const rawSearchParams = useSearchParams()
  const { startRouteTransition } = useRouteTransition()
  const [modified, setModified] = useState(false)
  const { getEntityConfig } = useConfig()
  const collectionConfig = getEntityConfig({ collectionSlug })

  const contextRef = useRef({} as IListQueryContext)
  contextRef.current.modified = modified

  const { onQueryChange: onQueryChangeFromContext } = useListDrawerContext()
  const onQueryChange = onQueryChangeFromContext || onQueryChangeFromProps

  const queryFromURL = useMemo<ListQuery>(
    () => sanitizeQuery(parseSearchParams(rawSearchParams)),
    [rawSearchParams],
  )

  const [query, setQuery] = useState<ListQuery>(() => {
    if (modifySearchParams) {
      return queryFromURL
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
      setModified(modified ?? true)

      const newQuery = mergeQuery(query, incomingQuery, {
        defaults: {
          limit: queryFromProps.limit,
          sort: queryFromProps.sort,
        },
      })

      if (modifySearchParams) {
        const search = `?${qs.stringify({
          ...newQuery,
          columns: JSON.stringify(newQuery.columns),
          queryByGroup: JSON.stringify(newQuery.queryByGroup),
        })}`
        if (window.location.search !== search) {
          startRouteTransition(() => router.replace(search))
        }
      } else if (typeof onQueryChange === 'function') {
        onQueryChange(newQuery)
      }

      setQuery(newQuery)
    },
    [
      query,
      queryFromProps.limit,
      queryFromProps.sort,
      modifySearchParams,
      onQueryChange,
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

  /**
   * The server component may pass props to this client component, e.g. from
   * fetching the query from preferences.
   * This effect is responsible for syncing the props back to the URL, without
   * triggering a re-render.
   */
  const syncPropsToURL = useEffectEvent(() => {
    const newQuery = sanitizeQuery({ ...(query || {}), ...(queryFromProps || {}) })

    const search = `?${qs.stringify({
      ...newQuery,
      columns: JSON.stringify(newQuery.columns),
      queryByGroup: JSON.stringify(newQuery.queryByGroup),
    })}`

    if (window.location.search !== search) {
      setQuery(newQuery)
      // Important: do not use router.replace here to avoid re-rendering.
      window.history.replaceState(null, '', search)
    }
  })

  // If `query` is updated externally, update the local state
  // E.g. when HMR runs, these properties may be different
  useEffect(() => {
    if (modifySearchParams && queryFromProps) {
      syncPropsToURL()
    }
  }, [modifySearchParams, queryFromProps])

  return (
    <ListQueryContext
      value={{
        collectionSlug,
        data,
        defaultLimit: data?.limit,
        handlePageChange,
        handlePerPageChange,
        handleSearchChange,
        handleSortChange,
        handleWhereChange,
        isGroupingBy: Boolean(collectionConfig?.admin?.groupBy && query?.groupBy),
        orderableFieldName,
        query,
        refineListData,
        setModified,
        ...contextRef.current,
      }}
    >
      <ListQueryModifiedContext value={modified}>{children}</ListQueryModifiedContext>
    </ListQueryContext>
  )
}
