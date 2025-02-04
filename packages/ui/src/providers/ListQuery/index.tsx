'use client'
import type { ListQuery, PaginatedDocs, Sort, Where } from 'payload'

import { useRouter, useSearchParams } from 'next/navigation.js'
import { isNumber } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { useListDrawerContext } from '../../elements/ListDrawer/Provider.js'
import { parseSearchParams } from '../../utilities/parseSearchParams.js'

type ContextHandlers = {
  handlePageChange?: (page: number) => Promise<void>
  handlePerPageChange?: (limit: number) => Promise<void>
  handleSearchChange?: (search: string) => Promise<void>
  handleSortChange?: (sort: string) => Promise<void>
  handleWhereChange?: (where: Where) => Promise<void>
}

export type ListQueryProps = {
  readonly children: React.ReactNode
  readonly collectionSlug?: string
  readonly data: PaginatedDocs
  readonly defaultLimit?: number
  readonly defaultSort?: Sort
  readonly modifySearchParams?: boolean
  readonly onQueryChange?: (query: ListQuery) => void
  readonly preferenceKey?: string
}

export type ListQueryContext = {
  data: PaginatedDocs
  defaultLimit?: number
  defaultSort?: Sort
  query: ListQuery
  refineListData: (args: ListQuery) => Promise<void>
} & ContextHandlers

const Context = createContext({} as ListQueryContext)

export const useListQuery = (): ListQueryContext => useContext(Context)

export const ListQueryProvider: React.FC<ListQueryProps> = ({
  children,
  data,
  defaultLimit,
  defaultSort,
  modifySearchParams,
  onQueryChange: onQueryChangeFromProps,
}) => {
  'use no memo'
  const router = useRouter()
  const rawSearchParams = useSearchParams()
  const searchParams = useMemo(() => parseSearchParams(rawSearchParams), [rawSearchParams])

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
        limit: 'limit' in query ? query.limit : (currentQuery?.limit ?? String(defaultLimit)),
        page,
        search: 'search' in query ? query.search : currentQuery?.search,
        sort: 'sort' in query ? query.sort : ((currentQuery?.sort as string) ?? defaultSort),
        where: 'where' in query ? query.where : currentQuery?.where,
      }

      if (modifySearchParams) {
        router.replace(`${qs.stringify(newQuery, { addQueryPrefix: true })}`)
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
      currentQuery?.page,
      currentQuery?.limit,
      currentQuery?.search,
      currentQuery?.sort,
      currentQuery?.where,
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

      if (shouldUpdateQueryString) {
        setCurrentQuery(newQuery)
        // Do not use router.replace here to avoid re-rendering on initial load
        window.history.pushState(null, '', `?${qs.stringify(newQuery)}`)
      }
    }
  }, [defaultSort, defaultLimit, router, modifySearchParams])

  return (
    <Context.Provider
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
    </Context.Provider>
  )
}
