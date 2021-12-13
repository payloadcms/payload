import { SanitizedCollectionConfig } from '../../../../../collections/config/types';
import { PaginatedDocs } from '../../../../../mongoose/types';
import { CompareOption } from '../types';

export type Props = {
  onChange: (val: unknown) => void,
  value: CompareOption,
  baseURL: string
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
