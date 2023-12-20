import type { SanitizedCollectionConfig } from '../../../../collections/config/types'
import type { FieldAffectingData } from '../../../../exports/types'
import type { Where } from '../../../../types'
import type { Props as ListProps } from '../../views/collections/List/types'
import type { Column } from '../Table/types'

export type Props = {
  collection: SanitizedCollectionConfig
  enableColumns?: boolean
  enableSort?: boolean
  handleSearchChange?: (search: string) => void
  handleSortChange?: (sort: string) => void
  handleWhereChange?: (where: Where) => void
  modifySearchQuery?: boolean
  resetParams?: ListProps['resetParams']
  titleField: FieldAffectingData
}

export type ListControls = {
  columns?: Partial<Column>[]
  where?: unknown
}
