import { PayloadRequest } from 'payload/types'
import type { SanitizedCollectionConfig } from '../../../../../../collections/config/types'
import type { PaginatedDocs } from '../../../../../../database/types'
import type { RelationshipField } from '../../../../../../fields/config/types'

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
  i18n: PayloadRequest['i18n']
  required: boolean
  type: 'CLEAR'
}

type ADD = {
  collection: SanitizedCollectionConfig
  data: PaginatedDocs<any>
  hasMultipleRelations: boolean
  i18n: PayloadRequest['i18n']
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
