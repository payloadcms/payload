import type { PaginatedDocs, SanitizedCollectionConfig } from 'payload'

import type { CompareOption } from '../Default/types.js'

export type Props = {
  baseURL: string
  draftsEnabled?: boolean
  latestDraftVersionID?: string
  latestPublishedVersionID?: string
  onChange: (val: CompareOption) => void
  parentID?: number | string
  versionFromOption: CompareOption
  versionToID: string
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
