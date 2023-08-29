import type { SanitizedCollectionConfig } from '../../../../../collections/config/types.js'
import type { PaginatedDocs } from '../../../../../database/types.js'
import type { Where } from '../../../../../types/index.js'
import type { Props as ListControlsProps } from '../../../elements/ListControls/types.js'
import type { Props as PaginatorProps } from '../../../elements/Paginator/types.js'
import type { Props as PerPageProps } from '../../../elements/PerPage/index.js'

export type Props = {
  collection: SanitizedCollectionConfig
  customHeader?: React.ReactNode
  data: PaginatedDocs<any>
  disableEyebrow?: boolean
  handleDelete?: () => void
  handlePageChange?: PaginatorProps['onChange']
  handlePerPageChange?: PerPageProps['handleChange']
  handleSortChange?: ListControlsProps['handleSortChange']
  handleWhereChange?: ListControlsProps['handleWhereChange']
  hasCreatePermission: boolean
  limit: number
  modifySearchParams?: boolean
  newDocumentURL: string
  onCreateNewClick?: () => void
  resetParams: (overrides?: { page?: number; sort?: string; where?: Where }) => void
  setLimit: (limit: number) => void
  setListControls: (controls: unknown) => void
  setSort: (sort: string) => void
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
