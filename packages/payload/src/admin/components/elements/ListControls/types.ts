import type { SanitizedCollectionConfig } from '../../../../collections/config/types'
import type { Where } from '../../../../types'
import type { Props as ListProps } from '../../views/collections/List/types'
import type { Column } from '../Table/types'

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
