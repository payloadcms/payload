import { SanitizedCollectionConfig } from '../../../../../collections/config/types.js';
import type { PaginatedDocs } from '../../../../../database/types.js';
import { CompareOption } from '../types.js';

export type Props = {
  onChange: (val: CompareOption) => void,
  value: CompareOption,
  baseURL: string
  publishedDoc: any
  versionID: string
  parentID?: string
}


type CLEAR = {
  type: 'CLEAR'
  required: boolean
}

type ADD = {
  type: 'ADD'
  data: PaginatedDocs<any>
  collection: SanitizedCollectionConfig
}

export type Action = CLEAR | ADD

export type ValueWithRelation = {
  relationTo: string
  value: string
}
