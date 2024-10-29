'use client'
import type { PaginatedDocs, Where } from 'payload'

import { useRouter } from 'next/navigation.js'
import { isNumber } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

import type { Column } from '../../elements/Table/index.js'

import { usePreferences } from '../Preferences/index.js'
import { useSearchParams } from '../SearchParams/index.js'

export type ColumnPreferences = Pick<Column, 'accessor' | 'active'>[]

type PropHandlers = {
  readonly handlePageChange?: (page: number) => Promise<void> | void
  readonly handlePerPageChange?: (limit: number) => Promise<void> | void
  readonly handleSearchChange?: (search: string) => Promise<void> | void
  readonly handleSortChange?: (sort: string) => Promise<void> | void
  readonly handleWhereChange?: (where: Where) => Promise<void> | void
}

type ContextHandlers = {
  handlePageChange?: (page: number) => Promise<void>
  handlePerPageChange?: (limit: number) => Promise<void>
  handleSearchChange?: (search: string) => Promise<void>
  handleSortChange?: (sort: string) => Promise<void>
  handleWhereChange?: (where: Where) => Promise<void>
  params: RefineOverrides
}

export type ListQueryProps = {
  readonly children: React.ReactNode
  readonly data: PaginatedDocs
  readonly defaultLimit?: number
  readonly defaultSort?: string
  readonly modifySearchParams?: boolean
  /**
   * Used to manage the query params manually. If you pass this prop, the provider will not manage the query params from the searchParams.
   * Useful for modals or other components that need to manage the query params themselves.
   */
  readonly params?: RefineOverrides
  readonly preferenceKey?: string
} & PropHandlers

export type ListQueryContext = {
  data: PaginatedDocs
  defaultLimit?: number
  defaultSort?: string
  refineListData: (args: RefineOverrides) => Promise<void>
} & ContextHandlers

const Context = createContext({} as ListQueryContext)

export const useListQuery = (): ListQueryContext => useContext(Context)

type RefineOverrides = {
  limit?: string
  page?: string
  search?: string
  sort?: string
  where?: Where
}

export const ListQueryProvider: React.FC<ListQueryProps> = ({
  children,
  data,
  defaultLimit,
  defaultSort,
  handlePageChange: handlePageChangeFromProps,
  handlePerPageChange: handlePerPageChangeFromProps,
  handleSearchChange: handleSearchChangeFromProps,
  handleSortChange: handleSortChangeFromProps,
  handleWhereChange: handleWhereChangeFromProps,
  modifySearchParams,
  params: paramsFromProps,
  preferenceKey,
}) => {
  const router = useRouter()
  const { setPreference } = usePreferences()
  const { searchParams: currentQuery } = useSearchParams()
  const [params, setParams] = useState(paramsFromProps || currentQuery)

  const refineListData = useCallback(
    async (query: RefineOverrides) => {
      if (!modifySearchParams) {
        return
      }

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

      const params = {
        limit: 'limit' in query ? query.limit : currentQuery?.limit,
        page: pageQuery,
        search: 'search' in query ? query.search : currentQuery?.search,
        sort: 'sort' in query ? query.sort : currentQuery?.sort,
        where: 'where' in query ? query.where : currentQuery?.where,
      }

      router.replace(`${qs.stringify(params, { addQueryPrefix: true })}`)
    },
    [
      modifySearchParams,
      currentQuery?.page,
      currentQuery?.limit,
      currentQuery?.search,
      currentQuery?.sort,
      currentQuery?.where,
      preferenceKey,
      router,
      setPreference,
    ],
  )

  const handlePageChange = useCallback(
    async (arg: number) => {
      if (typeof handlePageChangeFromProps === 'function') {
        await handlePageChangeFromProps(arg)
      }

      await refineListData({ page: String(arg) })
    },
    [refineListData, handlePageChangeFromProps],
  )

  const handlePerPageChange = React.useCallback(
    async (arg: number) => {
      if (typeof handlePerPageChangeFromProps === 'function') {
        await handlePerPageChangeFromProps(arg)
      }

      await refineListData({ limit: String(arg), page: '1' })
    },
    [refineListData, handlePerPageChangeFromProps],
  )

  const handleSearchChange = useCallback(
    async (arg: string) => {
      const search = arg === '' ? undefined : arg

      if (typeof handleSearchChangeFromProps === 'function') {
        await handleSearchChangeFromProps(search)
      }

      await refineListData({ search })
    },
    [handleSearchChangeFromProps, refineListData],
  )

  const handleSortChange = useCallback(
    async (arg: string) => {
      if (typeof handleSortChangeFromProps === 'function') {
        await handleSortChangeFromProps(arg)
      }

      await refineListData({ sort: arg })
    },
    [refineListData, handleSortChangeFromProps],
  )

  const handleWhereChange = useCallback(
    async (arg: Where) => {
      if (typeof handleWhereChangeFromProps === 'function') {
        await handleWhereChangeFromProps(arg)
      }

      await refineListData({ where: arg })
    },
    [refineListData, handleWhereChangeFromProps],
  )

  useEffect(() => {
    if (paramsFromProps) {
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
      setParams(paramsFromProps)
    } else {
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
        setParams(currentQuery)

        if (shouldUpdateQueryString) {
          router.replace(`?${qs.stringify(currentQuery)}`)
        }
      }
    }
  }, [defaultSort, defaultLimit, router, modifySearchParams, currentQuery, paramsFromProps, params])

  return (
    <Context.Provider
      value={{
        data,
        handlePageChange,
        handlePerPageChange,
        handleSearchChange,
        handleSortChange,
        handleWhereChange,
        params,
        refineListData,
      }}
    >
      {children}
    </Context.Provider>
  )
}
