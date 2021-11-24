import { PaginatedDocs, SanitizedCollectionConfig } from '../../../../../collections/config/types';
import { RelationshipField } from '../../../../../fields/config/types';

export type Props = Omit<RelationshipField, 'type'> & {
  path?: string
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
  relation: string
  hasMultipleRelations: boolean
  collection: SanitizedCollectionConfig
}

export type Action = CLEAR | ADD

export type ValueWithRelation = {
  relationTo: string
  value: string
}
