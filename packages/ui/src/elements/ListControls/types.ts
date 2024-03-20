import type { ClientCollectionConfig, FieldAffectingData, Where } from 'payload/types'

import type { FieldMap } from '../../index.js'
import type { Column } from '../Table/types.js'

export type Props = {
  collectionConfig: ClientCollectionConfig
  enableColumns?: boolean
  enableSort?: boolean
  fieldMap: FieldMap
  handleSearchChange?: (search: string) => void
  handleSortChange?: (sort: string) => void
  handleWhereChange?: (where: Where) => void
  textFieldsToBeSearched?: FieldAffectingData[]
  titleField: FieldAffectingData
}

export type ListControls = {
  columns?: Partial<Column>[]
  where?: unknown
}
