import type i18n from 'i18next'

import type { SanitizedCollectionConfig } from '../../../../../collections/config/types'
import type { SanitizedConfig } from '../../../../../config/types'
import type { RelationshipField } from '../../../../../fields/config/types'
import type { Where } from '../../../../../types'

export type Props = Omit<RelationshipField, 'type'> & {
  path?: string
}

export type Option = {
  label: string
  options?: Option[]
  relationTo?: string
  value: number | string
}

export type OptionGroup = {
  label: string
  options: Option[]
}

export type ValueWithRelation = {
  relationTo: string
  value: number | string
}

export type Value = ValueWithRelation | number | string

type CLEAR = {
  type: 'CLEAR'
}

type UPDATE = {
  collection: SanitizedCollectionConfig
  config: SanitizedConfig
  doc: any
  i18n: typeof i18n
  type: 'UPDATE'
}

type ADD = {
  collection: SanitizedCollectionConfig
  config: SanitizedConfig
  docs: any[]
  i18n: typeof i18n
  ids?: (number | string)[]
  sort?: boolean
  type: 'ADD'
}

export type Action = ADD | CLEAR | UPDATE

export type GetResults = (args: {
  lastFullyLoadedRelation?: number
  onSuccess?: () => void
  search?: string
  sort?: boolean
  value?: Value | Value[]
}) => Promise<void>

export type FilterOptionsResult = {
  [relation: string]: Where | boolean
}
