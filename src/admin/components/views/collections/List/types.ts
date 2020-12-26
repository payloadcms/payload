import { CollectionConfig, PaginatedDocs } from '../../../../../collections/config/types';
import { Column } from '../../../elements/Table/types';

export type Props = {
  collection: CollectionConfig
  data: PaginatedDocs
  newDocumentURL: string
  setListControls: (controls: unknown) => void
  setSort: (sort: string) => void
  columns: Column[]
  hasCreatePermission: boolean
}

export type ListIndexProps = {
  collection: CollectionConfig
}
