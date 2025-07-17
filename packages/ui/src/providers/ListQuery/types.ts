import type {
  ClientCollectionConfig,
  ColumnPreference,
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
  readonly collectionSlug?: ClientCollectionConfig['slug']
  readonly data: PaginatedDocs
  readonly modifySearchParams?: boolean
  readonly onQueryChange?: OnListQueryChange
  readonly orderableFieldName?: string
  /**
   * @deprecated
   */
  readonly preferenceKey?: string
  query?: ListQuery
}

export type IListQueryContext = {
  collectionSlug: ClientCollectionConfig['slug']
  data: PaginatedDocs
  defaultLimit?: number
  defaultSort?: Sort
  modified: boolean
  orderableFieldName?: string
  query: ListQuery
  refineListData: (args: ListQuery, setModified?: boolean) => Promise<void>
  setModified: (modified: boolean) => void
} & ContextHandlers
