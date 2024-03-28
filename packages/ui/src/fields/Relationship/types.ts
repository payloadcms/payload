import type { I18n } from '@payloadcms/translations'
import type { ClientCollectionConfig, FieldBase, RelationshipField } from 'payload/types'
import type { SanitizedConfig } from 'payload/types'

import type { FormFieldBase } from '../shared/index.js'

export type RelationshipFieldProps = FormFieldBase & {
  allowCreate?: RelationshipField['admin']['allowCreate']
  hasMany?: boolean
  isSortable?: boolean
  label?: FieldBase['label']
  name: string
  relationTo?: RelationshipField['relationTo']
  sortOptions?: RelationshipField['admin']['sortOptions']
  width?: string
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
  collection: ClientCollectionConfig
  config: SanitizedConfig
  doc: any
  i18n: I18n
  type: 'UPDATE'
}

type ADD = {
  collection: ClientCollectionConfig
  config: SanitizedConfig
  docs: any[]
  i18n: I18n
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
