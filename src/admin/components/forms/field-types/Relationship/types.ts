import i18n from 'i18next';
import { SanitizedCollectionConfig } from '../../../../../collections/config/types';
import { RelationshipField } from '../../../../../fields/config/types';
import { Where } from '../../../../../types';

export type Props = Omit<RelationshipField, 'type'> & {
  path?: string
}

export type Option = {
  label: string
  value: string | number
  relationTo?: string
  options?: Option[]
}

export type OptionGroup = {
  label: string
  options: Option[]
}

export type ValueAsObject = {
  relationTo: string
  value: string | number
}

export type Value = ValueAsObject | string | number

type CLEAR = {
  type: 'CLEAR'
}

type ADD = {
  type: 'ADD'
  docs: any[]
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
  onSuccess?: () => void
}) => Promise<void>

export type FilterOptionsResult = {
  [relation: string]: Where
}
