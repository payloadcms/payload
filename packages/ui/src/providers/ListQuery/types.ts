import type { ListQuery, PaginatedDocs, Sort, Where } from 'payload'

export type ListQueryProviderProps = {
  readonly children: React.ReactNode
  readonly collectionSlug?: string
  readonly data: PaginatedDocs
  readonly defaultLimit?: number
  readonly defaultSort?: Sort
  readonly modifySearchParams?: boolean
  readonly onQueryChange?: (query: ListQuery) => void
  readonly preferenceKey?: string
}

type ContextHandlers = {
  handlePageChange?: (page: number) => Promise<void>
  handlePerPageChange?: (limit: number) => Promise<void>
  handleSearchChange?: (search: string) => Promise<void>
  handleSortChange?: (sort: string) => Promise<void>
  handleWhereChange?: (where: Where) => Promise<void>
}

export type ListQueryContext = {
  data: PaginatedDocs
  defaultLimit?: number
  defaultSort?: Sort
  modified: boolean
  query: ListQuery
  refineListData: (args: ListQuery) => Promise<void>
  setModified: (modified: boolean) => void
} & ContextHandlers
