import type {
  ColumnPreference,
  ListPreferences,
  ListQuery,
  PaginatedDocs,
  Sort,
  Where,
} from 'payload'

type ContextHandlers = {
  handlePageChange?: (page: number) => Promise<void>
  handlePerPageChange?: (limit: number) => Promise<void>
  handleSearchChange?: (search: string) => Promise<void>
  handleSortChange?: (sort: string) => Promise<void>
  handleWhereChange?: (where: Where) => Promise<void>
}

export type OnListQueryChange = (query: ListQuery) => void

export type ListQueryProps = {
  readonly children: React.ReactNode
  readonly collectionSlug?: string
  readonly columns?: ColumnPreference[]
  readonly data: PaginatedDocs
  readonly defaultLimit?: number
  readonly defaultSort?: Sort
  readonly listPreferences?: ListPreferences
  readonly modifySearchParams?: boolean
  readonly onQueryChange?: OnListQueryChange
  /**
   * @deprecated
   */
  readonly preferenceKey?: string
}

export type IListQueryContext = {
  data: PaginatedDocs
  defaultLimit?: number
  defaultSort?: Sort
  query: ListQuery
  refineListData: (args: ListQuery) => Promise<void>
} & ContextHandlers
