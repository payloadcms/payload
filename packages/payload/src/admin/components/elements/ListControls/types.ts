import type { SanitizedCollectionConfig } from '../../../../collections/config/types.js'
import type { Where } from '../../../../types/index.js'
import type { Props as ListProps } from '../../views/collections/List/types.js'
import type { Column } from '../Table/types.js'

export type Props = {
  collection: SanitizedCollectionConfig
  enableColumns?: boolean
  enableSort?: boolean
  handleSortChange?: (sort: string) => void
  handleWhereChange?: (where: Where) => void
  modifySearchQuery?: boolean
  resetParams?: ListProps['resetParams']
}

export type ListControls = {
  columns?: Partial<Column>[]
  where?: unknown
}
