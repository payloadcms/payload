import type { SanitizedCollectionConfig } from '../../../../../collections/config/types.js';
import type { PaginatedDocs } from '../../../../../database/types.js';
import type { CompareOption } from '../types.js';

export type Props = {
  baseURL: string
  onChange: (val: CompareOption) => void,
  parentID?: string
  publishedDoc: any
  value: CompareOption,
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
