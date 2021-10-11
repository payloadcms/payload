import { SanitizedCollectionConfig, PaginatedDocs } from '../../../../../collections/config/types';
import { Column } from '../../../elements/Table/types';

export type Props = {
  collection: SanitizedCollectionConfig
  data: PaginatedDocs
  newDocumentURL: string
  setListControls: (controls: unknown) => void
  setSort: (sort: string) => void
  columns: Column[]
  hasCreatePermission: boolean
  setLimit: (limit: number) => void
  limit: number
}

export type ListIndexProps = {
  collection: SanitizedCollectionConfig
}
