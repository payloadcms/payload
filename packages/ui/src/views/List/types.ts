import type { SanitizedCollectionConfig, SanitizedConfig } from 'payload/types'
import type { PaginatedDocs } from 'payload/database'
import type { FieldAffectingData, Where } from 'payload/types'
import type { Props as ListControlsProps } from '../../elements/ListControls/types'
import type { Props as PaginatorProps } from '../../elements/Pagination/types'
import type { Props as PerPageProps } from '../../elements/PerPage'

export type DefaultListViewProps = {
  config: SanitizedConfig
  collectionConfig: SanitizedCollectionConfig
  customHeader?: React.ReactNode
  data: PaginatedDocs<any>
  handleDelete?: () => void
  handlePageChange?: PaginatorProps['onChange']
  handlePerPageChange?: PerPageProps['handleChange']
  handleSearchChange?: ListControlsProps['handleSearchChange']
  handleSortChange?: ListControlsProps['handleSortChange']
  handleWhereChange?: ListControlsProps['handleWhereChange']
  hasCreatePermission: boolean
  limit: number
  modifySearchParams?: boolean
  newDocumentURL: string
  onCreateNewClick?: () => void
  resetParams: (overrides?: {
    page?: number
    search?: string
    sort?: string
    where?: Where
  }) => void
  setLimit: (limit: number) => void
  setListControls: (controls: unknown) => void
  setSort: (sort: string) => void
  titleField?: FieldAffectingData
  toggleColumn: (column: string) => void
}

export type ListIndexProps = {
  collection: SanitizedCollectionConfig
}

export type ListPreferences = {
  columns: {
    accessor: string
    active: boolean
  }[]
  limit: number
  sort: number
}
