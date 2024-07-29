import type { SanitizedCollectionConfig } from '../../../../../collections/config/types'
import type { PaginatedDocs } from '../../../../../database/types'
import type { CompareOption } from '../types'

export type Props = {
  baseURL: string
  latestDraftVersion?: string
  latestPublishedVersion?: string
  onChange: (val: CompareOption) => void
  parentID?: string
  value: CompareOption
  versionID: string
}

type CLEAR = {
  required: boolean
  type: 'CLEAR'
}

type ADD = {
  collection: SanitizedCollectionConfig
  data: PaginatedDocs<any>
  type: 'ADD'
}

export type Action = ADD | CLEAR

export type ValueWithRelation = {
  relationTo: string
  value: string
}
