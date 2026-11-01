import type {
  ClientCollectionConfig,
  ListQuery,
  PaginatedDistinctDocs,
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

/**
 * Returned promises are awaited; return values are otherwise ignored.
 * The union of callbacks preserves TypeScript's `void` callback rule, allowing handlers such as `query => updates.push(query)`.
 * A union of return types would reject synchronous handlers that return a value.
 */
export type OnListQueryChange =
  | ((query: ListQuery) => Promise<unknown>)
  | ((query: ListQuery) => void)

export type ListQueryProps = {
  readonly children: React.ReactNode
  readonly collectionSlug?: ClientCollectionConfig['slug']
  readonly data: PaginatedDocs | undefined
  readonly modifySearchParams?: boolean
  readonly onQueryChange?: OnListQueryChange
  readonly orderableFieldName?: string
  readonly query?: ListQuery
}

export type IListQueryContext = {
  collectionSlug: ClientCollectionConfig['slug']
  data: ListQueryProps['data']
  defaultLimit?: number
  defaultSort?: Sort
  /** True when the where query contains at least one condition with a value. */
  hasActiveFilters: boolean
  /**
   * @experimental This prop is subject to change. Use at your own risk.
   */
  isGroupingBy: boolean
  modified: boolean
  orderableFieldName?: string
  query: ListQuery
  refineListData: (args: ListQuery, setModified?: boolean) => Promise<void>
  resolvedGroupBy?: string
  resolvedSearch?: string
  searchInput: string
  setModified: (modified: boolean) => void
  setSearchInput: (search: string) => void
} & ContextHandlers
