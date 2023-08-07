import i18n from 'i18next';
import { SanitizedCollectionConfig } from '../../../../../collections/config/types';
import { RelationshipField } from '../../../../../fields/config/types';
import { Where } from '../../../../../types';
import { SanitizedConfig } from '../../../../../config/types';

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

export type ValueWithRelation = {
  relationTo: string
  value: string | number
}

export type Value = ValueWithRelation | string | number

type CLEAR = {
  type: 'CLEAR'
}

type UPDATE = {
  type: 'UPDATE'
  doc: any
  collection: SanitizedCollectionConfig
  i18n: typeof i18n
  config: SanitizedConfig
}

type ADD = {
  type: 'ADD'
  docs: any[]
  collection: SanitizedCollectionConfig
  sort?: boolean
  ids?: (string | number)[]
  i18n: typeof i18n
  config: SanitizedConfig
}

export type Action = CLEAR | ADD | UPDATE

export type GetResults = (args: {
  lastFullyLoadedRelation?: number
  search?: string
  value?: Value | Value[]
  sort?: boolean
  onSuccess?: () => void
}) => Promise<void>

export type FilterOptionsResult = {
  [relation: string]: Where
}
