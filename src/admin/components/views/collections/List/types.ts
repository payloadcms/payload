import { SanitizedCollectionConfig } from '../../../../../collections/config/types';
import { PaginatedDocs } from '../../../../../mongoose/types';
import { Props as ListControlsProps } from '../../../elements/ListControls/types';
import { Props as PerPageProps } from '../../../elements/PerPage';
import { Props as PaginatorProps } from '../../../elements/Paginator/types';

export type Props = {
  collection: SanitizedCollectionConfig
  data: PaginatedDocs<any>
  newDocumentURL: string
  setListControls: (controls: unknown) => void
  setSort: (sort: string) => void
  toggleColumn: (column: string) => void
  hasCreatePermission: boolean
  setLimit: (limit: number) => void
  limit: number
  disableEyebrow?: boolean
  modifySearchParams?: boolean
  onCardClick?: (doc: any) => void
  disableCardLink?: boolean
  handleSortChange?: ListControlsProps['handleSortChange']
  handleWhereChange?: ListControlsProps['handleWhereChange']
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
