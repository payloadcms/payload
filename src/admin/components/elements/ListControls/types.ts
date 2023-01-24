import { Where } from '../../../../types';
import { SanitizedCollectionConfig } from '../../../../collections/config/types';
import { Column } from '../Table/types';
import { Props as ListProps } from '../../views/collections/List/types';

export type Props = {
  enableColumns?: boolean
  enableSort?: boolean
  modifySearchQuery?: boolean
  handleSortChange?: (sort: string) => void
  handleWhereChange?: (where: Where) => void
  columns?: ListProps['tableColumns']
  toggleColumn?: ListProps['toggleColumn']
  moveColumn?: ListProps['moveColumn']
  collection: SanitizedCollectionConfig
}

export type ListControls = {
  where?: unknown
  columns?: Partial<Column>[]
}
