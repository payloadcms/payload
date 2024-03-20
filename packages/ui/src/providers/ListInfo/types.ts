import type { ClientConfig, FieldAffectingData, SanitizedCollectionConfig } from 'payload/types'
import type React from 'react'

import type { Column } from '../../elements/Table/types.js'

export type ColumnPreferences = Pick<Column, 'accessor' | 'active'>[]

export type ListInfoProps = {
  Header?: React.ReactNode
  collectionConfig: ClientConfig['collections'][0]
  collectionSlug: SanitizedCollectionConfig['slug']
  hasCreatePermission: boolean
  listSearchableFields?: SanitizedCollectionConfig['admin']['listSearchableFields']
  newDocumentURL: string
  titleField?: FieldAffectingData
}

export type ListInfoContext = {
  Header?: React.ReactNode
  collectionSlug: string
  hasCreatePermission: boolean
  listSearchableFields: SanitizedCollectionConfig['admin']['listSearchableFields']
  newDocumentURL: string
  titleField?: FieldAffectingData
}
