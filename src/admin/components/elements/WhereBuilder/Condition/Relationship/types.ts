import { RelationshipField } from '../../../../../../fields/config/types';
import { SanitizedCollectionConfig } from '../../../../../../collections/config/types';
import { PaginatedDocs } from '../../../../../../mongoose/types';

export type Props = {
  onChange: (val: unknown) => void,
  value: unknown,
} & RelationshipField

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

export type GetResults = (args: { lastFullyLoadedRelation?: number, lastLoadedPage?: number, search?: string }) => Promise<void>
