import i18n from 'i18next';
import { SanitizedCollectionConfig } from '../../../../../collections/config/types';
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
}

type ADD = {
  type: 'ADD'
  docs: any[]
  hasMultipleRelations: boolean
  collection: SanitizedCollectionConfig
  sort?: boolean
  ids?: unknown[]
  i18n: typeof i18n
}

export type Action = CLEAR | ADD

export type ValueWithRelation = {
  relationTo: string
  value: string
}

export type GetResults = (args: {
  lastFullyLoadedRelation?: number
  lastLoadedPage?: number
  search?: string
  value?: unknown
  sort?: boolean
}) => Promise<void>
