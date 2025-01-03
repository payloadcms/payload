'use client'
import type { ListQuery, PaginatedDocs, Sort, Where } from 'payload'

import { useRouter, useSearchParams } from 'next/navigation.js'
import { isNumber } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import type { Column } from '../../elements/Table/index.js'

import { useListDrawerContext } from '../../elements/ListDrawer/Provider.js'
import { parseSearchParams } from '../../utilities/parseSearchParams.js'
import { usePreferences } from '../Preferences/index.js'

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
  collectionSlug,
  data,
  defaultLimit,
  defaultSort,
  modifySearchParams,
  onQueryChange: onQueryChangeFromProps,
  preferenceKey,
}) => {
  'use no memo'
  const { setPreference } = usePreferences()
  const rawSearchParams = useSearchParams()
  // const searchParams = useMemo(() => parseSearchParams(rawSearchParams), [rawSearchParams])

  return (
    <Context.Provider
      value={{
        data: {
          docs: [],
          hasNextPage: false,
          hasPrevPage: false,
          limit: 0,
          nextPage: 0,
          page: 0,
          pagingCounter: 0,
          prevPage: 0,
          totalDocs: 0,
          totalPages: 0,
        },
        // data,
        // handlePageChange,
        // handlePerPageChange,
        // handleSearchChange,
        // handleSortChange,
        // handleWhereChange,
        query: {},
        refineListData: () => Promise.resolve(),
      }}
    >
      {children}
    </Context.Provider>
  )
}
