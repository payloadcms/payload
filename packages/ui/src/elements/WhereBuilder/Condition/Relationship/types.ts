import type { I18nClient } from '@payloadcms/translations'
import type { ClientCollectionConfig, PaginatedDocs, RelationshipFieldClient } from 'payload'

import type { DefaultFilterProps } from '../types.js'

export type Props = {
  readonly field: RelationshipFieldClient
} & DefaultFilterProps

export type Option = {
  label: string
  options?: Option[]
  relationTo?: string | string[]
  value: string
}

type CLEAR = {
  i18n: I18nClient
  required: boolean
  type: 'CLEAR'
}

type ADD = {
  collection: ClientCollectionConfig
  data: PaginatedDocs<any>
  hasMultipleRelations: boolean
  i18n: I18nClient
  relation: string
  type: 'ADD'
}

export type Action = ADD | CLEAR

export type ValueWithRelation = {
  relationTo: string
  value: string
}

export type GetResults = (args: {
  lastFullyLoadedRelation?: number
  lastLoadedPage?: number
  search?: string
}) => Promise<void>
