'use client'
import type { PaginatedDocs, Where } from 'payload'

import { useRouter } from 'next/navigation.js'
import { isNumber } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { createContext, useContext } from 'react'

import type { Column } from '../../elements/Table/index.js'

import { usePreferences } from '../Preferences/index.js'
import { useSearchParams } from '../SearchParams/index.js'

export type ColumnPreferences = Pick<Column, 'accessor' | 'active'>[]

type PropHandlers = {
  handlePageChange?: (page: number) => Promise<void> | void
  handlePerPageChange?: (limit: number) => Promise<void> | void
  handleSearchChange?: (search: string) => Promise<void> | void
  handleSortChange?: (sort: string) => Promise<void> | void
  handleWhereChange?: (where: Where) => Promise<void> | void
}

type ContextHandlers = {
  handlePageChange?: (page: number) => Promise<void>
  handlePerPageChange?: (limit: number) => Promise<void>
  handleSearchChange?: (search: string) => Promise<void>
  handleSortChange?: (sort: string) => Promise<void>
  handleWhereChange?: (where: Where) => Promise<void>
}

export type ListQueryProps = {
  readonly children: React.ReactNode
  readonly data: PaginatedDocs
  readonly defaultLimit?: number
  readonly defaultSort?: string
  readonly modifySearchParams?: boolean
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
  preferenceKey,
}) => {
  const router = useRouter()
  const { setPreference } = usePreferences()
  const hasSetInitialParams = React.useRef(false)
  const { searchParams: currentQuery } = useSearchParams()

  const refineListData = React.useCallback(
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
        updatedPreferences.limit = query.limit
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
    [preferenceKey, modifySearchParams, router, setPreference, currentQuery],
  )

  const handlePageChange = React.useCallback(
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

      await refineListData({ limit: String(arg) })
    },
    [refineListData, handlePerPageChangeFromProps],
  )

  const handleSearchChange = React.useCallback(
    async (arg: string) => {
      if (typeof handleSearchChangeFromProps === 'function') {
        await handleSearchChangeFromProps(arg)
      }

      await refineListData({ search: arg })
    },
    [refineListData, handleSearchChangeFromProps],
  )

  const handleSortChange = React.useCallback(
    async (arg: string) => {
      if (typeof handleSortChangeFromProps === 'function') {
        await handleSortChangeFromProps(arg)
      }

      await refineListData({ sort: arg })
    },
    [refineListData, handleSortChangeFromProps],
  )

  const handleWhereChange = React.useCallback(
    async (arg: Where) => {
      if (typeof handleWhereChangeFromProps === 'function') {
        await handleWhereChangeFromProps(arg)
      }

      await refineListData({ where: arg })
    },
    [refineListData, handleWhereChangeFromProps],
  )

  React.useEffect(() => {
    if (!hasSetInitialParams.current) {
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

        if (shouldUpdateQueryString) {
          router.replace(`?${qs.stringify(currentQuery)}`)
        }
      }

      hasSetInitialParams.current = true
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
        refineListData,
      }}
    >
      {children}
    </Context.Provider>
  )
}
