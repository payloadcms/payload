import { Where } from '../../../../../types/index.js';
import { SanitizedCollectionConfig } from '../../../../../collections/config/types.js';
import type { PaginatedDocs } from '../../../../../database/types.js';
import { Props as ListControlsProps } from '../../../elements/ListControls/types.js';
import { Props as PerPageProps } from '../../../elements/PerPage/index.js';
import { Props as PaginatorProps } from '../../../elements/Paginator/types.js';

export type Props = {
  collection: SanitizedCollectionConfig
  data: PaginatedDocs<any>
  newDocumentURL: string
  setListControls: (controls: unknown) => void
  setSort: (sort: string) => void
  toggleColumn: (column: string) => void
  resetParams: (overrides?: { page?: number, sort?: string, where?: Where }) => void
  hasCreatePermission: boolean
  setLimit: (limit: number) => void
  limit: number
  disableEyebrow?: boolean
  modifySearchParams?: boolean
  handleSortChange?: ListControlsProps['handleSortChange']
  handleWhereChange?: ListControlsProps['handleWhereChange']
  handleDelete?: () => void
  handlePageChange?: PaginatorProps['onChange']
  handlePerPageChange?: PerPageProps['handleChange']
  onCreateNewClick?: () => void
  customHeader?: React.ReactNode
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
