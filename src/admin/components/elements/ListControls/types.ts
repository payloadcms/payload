import { Where } from '../../../../types';
import { SanitizedCollectionConfig } from '../../../../collections/config/types';

export type Props = {
  enableColumns?: boolean,
  enableSort?: boolean,
  modifySearchQuery?: boolean
  handleSortChange?: (sort: string) => void
  handleWhereChange?: (where: Where) => void
  columns?: string[]
  setColumns?: (columns: string[]) => void,
  collection: SanitizedCollectionConfig,
}

export type ListControls = {
  where?: unknown
  columns?: string[]
}
