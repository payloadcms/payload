import { type i18n } from 'i18next';

import type { SanitizedCollectionConfig } from '../../../../../../collections/config/types.js';
import type { PaginatedDocs } from '../../../../../../database/types.js';
import type { RelationshipField } from '../../../../../../fields/config/types.js';

export type Props = {
  onChange: (val: unknown) => void,
  value: unknown,
} & RelationshipField

export type Option = {
  label: string
  options?: Option[]
  relationTo?: string
  value: string
}

type CLEAR = {
  i18n: i18n
  required: boolean
  type: 'CLEAR'
}

type ADD = {
  collection: SanitizedCollectionConfig
  data: PaginatedDocs<any>
  hasMultipleRelations: boolean
  i18n: i18n
  relation: string
  type: 'ADD'
}

export type Action = ADD | CLEAR

export type ValueWithRelation = {
  relationTo: string
  value: string
}

export type GetResults = (args: { lastFullyLoadedRelation?: number, lastLoadedPage?: number, search?: string }) => Promise<void>
