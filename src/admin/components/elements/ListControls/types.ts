import { Where } from '../../../../types';
import { SanitizedCollectionConfig } from '../../../../collections/config/types';
import type { Props as ListProps } from '../../views/collections/List/types';

export type Props = {
  enableColumns?: boolean,
  enableSort?: boolean,
  modifySearchQuery?: boolean
  handleSortChange?: (sort: string) => void
  handleWhereChange?: (where: Where) => void
  resetParams?: ListProps['resetParams']
  columns?: string[]
  setColumns?: (columns: string[]) => void,
  collection: SanitizedCollectionConfig,
}

export type ListControls = {
  where?: unknown
  columns?: string[]
}
