import { SanitizedCollectionConfig } from '../../../../../collections/config/types';
import type { PaginatedDocs } from '../../../../../database/types';
import { CompareOption } from '../types';

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
