import type { Data, FieldAffectingData, SanitizedCollectionConfig, Where } from 'payload/types'
import type React from 'react'

import type { Column } from '../../elements/Table/index.js'

export type ColumnPreferences = Pick<Column, 'accessor' | 'active'>[]

export type ListInfoProps = {
  Header?: React.ReactNode
  collectionSlug: SanitizedCollectionConfig['slug']
  data: Data
  handlePageChange?: (page: number) => void
  handlePerPageChange?: (limit: number) => void
  handleSearchChange?: (search: string) => void
  handleSortChange?: (sort: string) => void
  handleWhereChange?: (where: Where) => void
  hasCreatePermission: boolean
  limit: SanitizedCollectionConfig['admin']['pagination']['defaultLimit']
  modifySearchParams?: false
  newDocumentURL: string
  setLimit?: (limit: number) => void
  setSort?: (sort: string) => void
  titleField?: FieldAffectingData
}

export type ListInfo = ListInfoProps & {
  // add context properties here as needed
  // see `DocumentInfo` for an example
}

export type ListInfoContext = ListInfo & {
  // add context methods here as needed
  // see `DocumentInfoContext` for an example
}
