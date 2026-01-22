import type { ClientCollectionConfig, ListQuery, PaginatedDocs, Sort } from 'payload'

export type OnListQueryChange = (query: ListQuery) => void

export type ListQueryProps = {
  readonly children: React.ReactNode
  readonly collectionSlug?: ClientCollectionConfig['slug']
  readonly data: PaginatedDocs | undefined
  /**
   * Params resolved from preferences/defaults that should be synced to URL on initial load.
   * Client will use history.replaceState to add these to URL without causing a navigation.
   */
  readonly initialParams?: ListQuery
  readonly modifySearchParams?: boolean
  readonly onQueryChange?: OnListQueryChange
  readonly orderableFieldName?: string
  /**
   * @deprecated
   */
  readonly preferenceKey?: string
  readonly query?: ListQuery
}

export type IListQueryContext = {
  collectionSlug: ClientCollectionConfig['slug']
  data: ListQueryProps['data']
  defaultLimit?: number
  defaultSort?: Sort
  /**
   * @deprecated Use `setQuery({ page: number })` instead
   */
  handlePageChange?: (page: number) => void
  /**
   * @deprecated Use `setQuery({ limit: number })` instead
   */
  handlePerPageChange?: (limit: number) => void
  /**
   * @experimental This prop is subject to change. Use at your own risk.
   */
  isGroupingBy: boolean
  modified: boolean
  orderableFieldName?: string
  query: ListQuery
  setModified: (modified: boolean) => void
  /**
   * Update query params. Pass null to remove a param.
   * @example setQuery({ page: 2 })
   * @example setQuery({ preset: null }) // removes preset
   */
  setQuery: (params: Partial<ListQuery>) => void
}
