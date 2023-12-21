import type { SanitizedCollectionConfig, FieldAffectingData, Where } from 'payload/types'
import type { Props as ListProps } from '../../views/List/types'
import type { Column } from '../Table/types'

export type Props = {
  enableColumns?: boolean
  enableSort?: boolean
  handleSearchChange?: (search: string) => void
  handleSortChange?: (sort: string) => void
  handleWhereChange?: (where: Where) => void
  modifySearchQuery?: boolean
  resetParams?: ListProps['resetParams']
  titleField: FieldAffectingData
  textFieldsToBeSearched?: FieldAffectingData[]
}

export type ListControls = {
  columns?: Partial<Column>[]
  where?: unknown
}
