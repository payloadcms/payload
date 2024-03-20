import type {
  ClientConfig,
  Data,
  FieldAffectingData,
  SanitizedCollectionConfig,
  Where,
} from 'payload/types'
import type React from 'react'

import type { Column } from '../../elements/Table/index.js'

export type ColumnPreferences = Pick<Column, 'accessor' | 'active'>[]

export type ListInfoProps = {
  Header?: React.ReactNode
  collectionConfig: ClientConfig['collections'][0]
  collectionSlug: SanitizedCollectionConfig['slug']
  data: Data
  handlePageChange?: (page: number) => void
  handlePerPageChange?: (limit: number) => void
  handleSearchChange?: (search: string) => void
  handleSortChange?: (sort: string) => void
  handleWhereChange?: (where: Where) => void
  hasCreatePermission: boolean
  limit: SanitizedCollectionConfig['admin']['pagination']['defaultLimit']
  listSearchableFields?: SanitizedCollectionConfig['admin']['listSearchableFields']
  modifySearchParams?: false
  newDocumentURL: string
  page?: number
  setLimit?: (limit: number) => void
  setSort?: (sort: string) => void
  sort?: string
  titleField?: FieldAffectingData
}

export type ListInfo = ListInfoProps & {
  // add context properties here as needed
  // see `DocumentInfo` for an example
}

export type ListInfoContext = {
  Header?: React.ReactNode
  collectionSlug: string
  data: Data
  handlePageChange?: (page: number) => void
  handlePerPageChange?: (limit: number) => void
  handleSearchChange?: (search: string) => void
  handleSortChange?: (sort: string) => void
  handleWhereChange?: (where: Where) => void
  hasCreatePermission: boolean
  limit: number
  listSearchableFields: SanitizedCollectionConfig['admin']['listSearchableFields']
  modifySearchParams: boolean
  newDocumentURL: string
  titleField?: FieldAffectingData
}
