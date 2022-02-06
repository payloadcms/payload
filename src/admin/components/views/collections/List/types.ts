import { SanitizedCollectionConfig } from '../../../../../collections/config/types';
import { PaginatedDocs } from '../../../../../mongoose/types';
import { Column } from '../../../elements/Table/types';

export type Props = {
  collection: SanitizedCollectionConfig
  data: PaginatedDocs<any>
  newDocumentURL: string
  setListControls: (controls: unknown) => void
  setSort: (sort: string) => void
  tableColumns: Column[]
  columnNames: string[]
  setColumns: (columns: string[]) => void
  hasCreatePermission: boolean
  setLimit: (limit: number) => void
  limit: number
}

export type ListIndexProps = {
  collection: SanitizedCollectionConfig
}

export type ListPreferences = {
  columns: string[]
  limit: number
  sort: number
}
