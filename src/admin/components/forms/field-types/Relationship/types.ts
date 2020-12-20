import { PaginatedDocs, CollectionConfig } from '../../../../../collections/config/types';
import { RelationshipField } from '../../../../../fields/config/types';

export type OptionsPage = {
  relation: string
  data: PaginatedDocs
}

export type Props = Omit<RelationshipField, 'type'> & {
  path?: string
}

export type Option = {
  label: string
  value: string
  relationTo?: string
  options?: Option[]
}

type REPLACE = {
  type: 'REPLACE'
  payload: Option[]
}

type ADD = {
  type: 'ADD'
  data: PaginatedDocs
  relation: string
  hasMultipleRelations: boolean
  labelKey: string
  collection: CollectionConfig
}

export type Action = REPLACE | ADD
