import { Where } from '../../../../types.js';
import { SanitizedCollectionConfig } from '../../../../collections/config/types.js';
import { Column } from '../Table/types.js';
import type { Props as ListProps } from '../../views/collections/List/types.js';

export type Props = {
  enableColumns?: boolean
  enableSort?: boolean
  modifySearchQuery?: boolean
  handleSortChange?: (sort: string) => void
  handleWhereChange?: (where: Where) => void
  collection: SanitizedCollectionConfig
  resetParams?: ListProps['resetParams']
}

export type ListControls = {
  where?: unknown
  columns?: Partial<Column>[]
}
