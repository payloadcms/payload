import type { SanitizedCollectionConfig, FieldAffectingData, Where } from 'payload/types'
import type { DefaultListViewProps } from '../../views/List/types'
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
  resetParams?: DefaultListViewProps['resetParams']
  titleField: FieldAffectingData
  textFieldsToBeSearched?: FieldAffectingData[]
}

export type ListControls = {
  columns?: Partial<Column>[]
  where?: unknown
}
