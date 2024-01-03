import type { SanitizedCollectionConfig } from 'payload/types'
import type { PaginatedDocs } from 'payload/database'
import type { CompareOption } from '../Default/types'

export type Props = {
  baseURL: string
  onChange: (val: CompareOption) => void
  parentID?: string
  publishedDoc: any
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
