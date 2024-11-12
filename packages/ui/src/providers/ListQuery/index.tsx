'use client'
import type { ListQuery, PaginatedDocs, Where } from 'payload'

import { useRouter } from 'next/navigation.js'
import { isNumber } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

import type { Column } from '../../elements/Table/index.js'

import { useListDrawerContext } from '../../elements/ListDrawer/Provider.js'
import { usePreferences } from '../Preferences/index.js'
import { useSearchParams } from '../SearchParams/index.js'

export type ColumnPreferences = Pick<Column, 'accessor' | 'active'>[]

type ContextHandlers = {
  handlePageChange?: (page: number) => Promise<void>
  handlePerPageChange?: (limit: number) => Promise<void>
  handleSearchChange?: (search: string) => Promise<void>
  handleSortChange?: (sort: string) => Promise<void>
  handleWhereChange?: (where: Where) => Promise<void>
}

export type ListQueryProps = {
  readonly children: React.ReactNode
  readonly collectionSlug: string
  readonly data: PaginatedDocs
  readonly defaultLimit?: number
  readonly defaultSort?: string
  readonly modifySearchParams?: boolean
  readonly onQueryChange?: (query: ListQuery) => void
  readonly preferenceKey?: string
}

export type ListQueryContext = {
  data: PaginatedDocs
  defaultLimit?: number
  defaultSort?: string
  query: ListQuery
  refineListData: (args: ListQuery) => Promise<void>
} & ContextHandlers

const Context = createContext({} as ListQueryContext)

export const useListQuery = (): ListQueryContext => useContext(Context)

export const ListQueryProvider: React.FC<ListQueryProps> = ({
  children,
  collectionSlug,
  data,
  defaultLimit,
  defaultSort,
  modifySearchParams,
  onQueryChange: onQueryChangeFromProps,
  preferenceKey,
}) => {
  'use no memo'
  const router = useRouter()
  const { setPreference } = usePreferences()
  const { searchParams } = useSearchParams()

  const { onQueryChange } = useListDrawerContext()

  const [currentQuery, setCurrentQuery] = useState(() => {
    if (modifySearchParams) {
      return searchParams
    } else {
      return {}
    }
  })

  useEffect(() => {
    if (modifySearchParams) {
      setCurrentQuery(searchParams)
    }
  }, [searchParams, modifySearchParams])

  const refineListData = useCallback(
    async (query: ListQuery) => {
      let pageQuery = 'page' in query ? query.page : currentQuery?.page

      if ('where' in query || 'search' in query) {
        pageQuery = '1'
      }

      const updatedPreferences: Record<string, unknown> = {}
      let updatePreferences = false

      if ('limit' in query) {
        updatedPreferences.limit = Number(query.limit)
        updatePreferences = true
      }

      if ('sort' in query) {
        updatedPreferences.sort = query.sort
        updatePreferences = true
      }

      if (updatePreferences && preferenceKey) {
        await setPreference(preferenceKey, updatedPreferences)
      }

      const newQuery: ListQuery = {
        limit: 'limit' in query ? query.limit : (currentQuery?.limit as string),
        page: pageQuery as string,
        search: 'search' in query ? query.search : (currentQuery?.search as string),
        sort: 'sort' in query ? query.sort : (currentQuery?.sort as string),
        where: 'where' in query ? query.where : (currentQuery?.where as Where),
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
    },
    [
      modifySearchParams,
      currentQuery?.page,
      currentQuery?.limit,
      currentQuery?.sort,
      currentQuery?.where,
      currentQuery?.search,
      preferenceKey,
      router,
      setPreference,
      onQueryChange,
      onQueryChangeFromProps,
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

  useEffect(() => {
    if (modifySearchParams) {
      let shouldUpdateQueryString = false

      if (isNumber(defaultLimit) && !('limit' in currentQuery)) {
        currentQuery.limit = String(defaultLimit)
        shouldUpdateQueryString = true
      }

      if (defaultSort && !('sort' in currentQuery)) {
        currentQuery.sort = defaultSort
        shouldUpdateQueryString = true
      }

      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
      setCurrentQuery(currentQuery)

      if (shouldUpdateQueryString) {
        router.replace(`?${qs.stringify(currentQuery)}`)
      }
    }
  }, [defaultSort, defaultLimit, router, modifySearchParams, currentQuery])

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
