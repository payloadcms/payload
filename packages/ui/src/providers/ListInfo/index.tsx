'use client'
import type { Where } from 'payload/types.js'

import { useRouter } from 'next/navigation.js'
import { isNumber } from 'payload/utilities'
import QueryString from 'qs'
import React, { createContext, useContext } from 'react'

import type { ListInfoContext, ListInfoProps } from './types.js'

export type * from './types.js'
import { usePreferences } from '../Preferences/index.js'

const Context = createContext({} as ListInfoContext)

export const useListInfo = (): ListInfoContext => useContext(Context)

type RefineOverrides = {
  limit?: string
  page?: string
  search?: string
  sort?: string
  where?: Where
}

export const ListInfoProvider: React.FC<
  ListInfoProps & {
    children: React.ReactNode
  }
> = ({
  children,
  collectionSlug,
  data,
  handlePageChange: handlePageChangeFromProps,
  handlePerPageChange: handlePerPageChangeFromProps,
  handleSearchChange: handleSearchChangeFromProps,
  handleSortChange: handleSortChangeFromProps,
  handleWhereChange: handleWhereChangeFromProps,
  hasCreatePermission,
  limit,
  listSearchableFields,
  modifySearchParams,
  newDocumentURL,
  sort,
  titleField,
}) => {
  const router = useRouter()
  const { setPreference } = usePreferences()
  const hasSetInitialParams = React.useRef(false)

  const refineListData = React.useCallback(
    async (query: RefineOverrides) => {
      if (!modifySearchParams) return

      const currentQuery = QueryString.parse(window.location.search, {
        ignoreQueryPrefix: true,
      }) as QueryString.ParsedQs & {
        where: Where
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
      if (updatePreferences) {
        await setPreference(`${collectionSlug}-list`, updatedPreferences)
      }

      const params = {
        limit: 'limit' in query ? query.limit : currentQuery?.limit,
        page: 'page' in query ? query.page : currentQuery?.page,
        search: 'search' in query ? query.search : currentQuery?.search,
        sort: 'sort' in query ? query.sort : currentQuery?.sort,
        where: 'where' in query ? query.where : currentQuery?.where,
      }

      router.replace(`?${QueryString.stringify(params)}`)
    },
    [collectionSlug, modifySearchParams, router, setPreference],
  )

  const handlePageChange = React.useCallback(
    async (arg: number) => {
      if (typeof handlePageChangeFromProps === 'function') {
        handlePageChangeFromProps(arg)
      }
      await refineListData({ page: String(arg) })
    },
    [refineListData, handlePageChangeFromProps],
  )
  const handlePerPageChange = React.useCallback(
    async (arg: number) => {
      if (typeof handlePerPageChangeFromProps === 'function') {
        handlePerPageChangeFromProps(arg)
      }
      await refineListData({ limit: String(arg) })
    },
    [refineListData, handlePerPageChangeFromProps],
  )
  const handleSearchChange = React.useCallback(
    async (arg: string) => {
      if (typeof handleSearchChangeFromProps === 'function') {
        handleSearchChangeFromProps(arg)
      }
      await refineListData({ search: arg })
    },
    [refineListData, handleSearchChangeFromProps],
  )
  const handleSortChange = React.useCallback(
    async (arg: string) => {
      if (typeof handleSortChangeFromProps === 'function') {
        handleSortChangeFromProps(arg)
      }
      await refineListData({ sort: arg })
    },
    [refineListData, handleSortChangeFromProps],
  )
  const handleWhereChange = React.useCallback(
    async (arg: Where) => {
      if (typeof handleWhereChangeFromProps === 'function') {
        handleWhereChangeFromProps(arg)
      }
      await refineListData({ where: arg })
    },
    [refineListData, handleWhereChangeFromProps],
  )

  React.useEffect(() => {
    if (!hasSetInitialParams.current) {
      const currentQuery = QueryString.parse(window.location.search, {
        ignoreQueryPrefix: true,
      })
      let shouldUpdateQueryString = false

      if (isNumber(limit) && !('limit' in currentQuery)) {
        currentQuery.limit = String(limit)
        shouldUpdateQueryString = true
      }
      if (sort && !('sort' in currentQuery)) {
        currentQuery.sort = sort
        shouldUpdateQueryString = true
      }
      if (shouldUpdateQueryString) {
        router.replace(`?${QueryString.stringify(currentQuery)}`)
      }

      hasSetInitialParams.current = true
    }
  }, [sort, limit, router])

  return (
    <Context.Provider
      value={{
        collectionSlug,
        data,
        handlePageChange,
        handlePerPageChange,
        handleSearchChange,
        handleSortChange,
        handleWhereChange,
        hasCreatePermission,
        limit,
        listSearchableFields,
        modifySearchParams,
        newDocumentURL,
        titleField,
      }}
    >
      {children}
    </Context.Provider>
  )
}
