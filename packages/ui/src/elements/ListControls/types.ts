import type { FieldAffectingData, SanitizedCollectionConfig, Where } from 'payload/types'

import type { Column } from '../Table/types.js'

export type Props = {
  collectionConfig: SanitizedCollectionConfig
  enableColumns?: boolean
  enableSort?: boolean
  handleSearchChange?: (search: string) => void
  handleSortChange?: (sort: string) => void
  handleWhereChange?: (where: Where) => void
  modifySearchQuery?: boolean
  textFieldsToBeSearched?: FieldAffectingData[]
  titleField: FieldAffectingData
}

export type ListControls = {
  columns?: Partial<Column>[]
  where?: unknown
}
