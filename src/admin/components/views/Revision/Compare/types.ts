import { SanitizedCollectionConfig } from '../../../../../collections/config/types';
import { PaginatedDocs } from '../../../../../mongoose/types';

export type Props = {
  onChange: (val: unknown) => void,
  value: Option,
  baseURL: string
}

export type Option = {
  label: string
  value: string
  relationTo?: string
  options?: Option[]
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
