import type { SanitizedCollectionConfig, RelationshipField } from 'payload/types'
import type { PaginatedDocs } from 'payload/database'
import type { I18n } from '@payloadcms/translations'

export type Props = {
  disabled?: boolean
  onChange: (val: unknown) => void
  value: unknown
} & RelationshipField

export type Option = {
  label: string
  options?: Option[]
  relationTo?: string
  value: string
}

type CLEAR = {
  i18n: I18n
  required: boolean
  type: 'CLEAR'
}

type ADD = {
  collection: SanitizedCollectionConfig
  data: PaginatedDocs<any>
  hasMultipleRelations: boolean
  i18n: I18n
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
