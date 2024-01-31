import type { SanitizedCollectionConfig } from '../../../../../collections/config/types'
import type { PaginatedDocs } from '../../../../../database/types'
import type { FieldAffectingData } from '../../../../../exports/types'
import type { Where } from '../../../../../types'
import type { Props as ListControlsProps } from '../../../elements/ListControls/types'
import type { Props as PaginatorProps } from '../../../elements/Paginator/types'
import type { Props as PerPageProps } from '../../../elements/PerPage'

export type Props<T = any> = {
  collection: SanitizedCollectionConfig
  customHeader?: React.ReactNode
  data: PaginatedDocs<T>
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
