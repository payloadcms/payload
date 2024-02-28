import type { FieldAffectingData, SanitizedCollectionConfig, Where } from 'payload/types'

import type { Column } from '../Table/types'

export type Props = {
  collectionPluralLabel: SanitizedCollectionConfig['labels']['plural']
  collectionSlug: SanitizedCollectionConfig['slug']
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
