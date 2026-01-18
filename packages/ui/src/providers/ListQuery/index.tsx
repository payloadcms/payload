'use client'
import { useRouter, useSearchParams } from 'next/navigation.js'
import { type ListQuery, type Where } from '@ruya.sa/payload'
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
  // TODO: Investigate if this is still needed

  const router = useRouter()
  const rawSearchParams = useSearchParams()
  const { startRouteTransition } = useRouteTransition()
  const [modified, setModified] = useState(false)
  const { getEntityConfig } = useConfig()
  const collectionConfig = getEntityConfig({ collectionSlug })

  const searchParams = useMemo<ListQuery>(
    () => sanitizeQuery(parseSearchParams(rawSearchParams)),
    [rawSearchParams],
  )

  const contextRef = useRef({} as IListQueryContext)

  contextRef.current.modified = modified

  const { onQueryChange } = useListDrawerContext()

  const [query, setQuery] = useState<ListQuery>(() => {
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

      const newQuery = mergeQuery(query, incomingQuery, {
        defaults: {
          limit: queryFromProps.limit,
          sort: queryFromProps.sort,
        },
      })

      if (modifySearchParams) {
        startRouteTransition(() =>
          router.replace(
            `${qs.stringify(
              {
                ...newQuery,
                columns: JSON.stringify(newQuery.columns),
                queryByGroup: JSON.stringify(newQuery.queryByGroup),
              },
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

      setQuery(newQuery)
    },
    [
      query,
      queryFromProps.limit,
      queryFromProps.sort,
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

  const mergeQueryFromPropsAndSyncToURL = useEffectEvent(() => {
    const newQuery = sanitizeQuery({ ...(query || {}), ...(queryFromProps || {}) })

    const search = `?${qs.stringify({
      ...newQuery,
      columns: JSON.stringify(newQuery.columns),
      queryByGroup: JSON.stringify(newQuery.queryByGroup),
    })}`

    if (window.location.search !== search) {
      setQuery(newQuery)

      // Important: do not use router.replace here to avoid re-rendering on initial load
      window.history.replaceState(null, '', search)
    }
  })

  // If `query` is updated externally, update the local state
  // E.g. when HMR runs, these properties may be different
  useEffect(() => {
    if (modifySearchParams) {
      mergeQueryFromPropsAndSyncToURL()
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
