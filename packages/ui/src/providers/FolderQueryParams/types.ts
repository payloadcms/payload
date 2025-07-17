import type { FolderQueryParams, Sort, Where } from 'payload'

export type OnFolderQueryParamsChange = (query: FolderQueryParams) => void

export type FolderQueryParamsProps = {
  readonly children: React.ReactNode
  readonly defaultDocLimit?: number
  readonly defaultFolderLimit?: number
  readonly defaultSort?: Sort
  readonly modifySearchParams?: boolean
  readonly onQueryChange?: OnFolderQueryParamsChange
}

export type IFolderQueryParamsContext = {
  defaultDocLimit?: number
  defaultFolderLimit?: number
  defaultSort?: Sort
  handleDocPageChange?: (page: number) => Promise<void>
  handleDocPerPageChange?: (limit: number) => Promise<void>
  handleFolderPageChange?: (page: number) => Promise<void>
  handleFolderPerPageChange?: (limit: number) => Promise<void>
  handleRelationToChange?: (relationTo: string[]) => Promise<void>
  handleSearchChange?: (search: string) => Promise<void>
  handleSortChange?: (sort: string) => Promise<void>
  handleWhereChange?: (where: Where) => Promise<void>
  modified: boolean
  query: FolderQueryParams
  refineFolderParams: (args: FolderQueryParams, setModified?: boolean) => Promise<void>
  setModified: (modified: boolean) => void
}
