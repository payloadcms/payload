import type { I18nClient } from '@payloadcms/translations'
import type { ClientCollectionConfig, RelationshipField, SanitizedConfig } from 'payload'

import type { FormFieldBase } from '../shared/index.js'

export type RelationshipFieldProps = {
  allowCreate?: RelationshipField['admin']['allowCreate']
  hasMany?: boolean
  isSortable?: boolean
  name: string
  relationTo?: RelationshipField['relationTo']
  sortOptions?: RelationshipField['admin']['sortOptions']
  width?: string
} & FormFieldBase

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
  i18n: I18nClient
  type: 'UPDATE'
}

type ADD = {
  collection: ClientCollectionConfig
  config: SanitizedConfig
  docs: any[]
  i18n: I18nClient
  ids?: (number | string)[]
  sort?: boolean
  type: 'ADD'
}

export type Action = ADD | CLEAR | UPDATE

export type GetResults = (args: {
  lastFullyLoadedRelation?: number
  lastLoadedPage: Record<string, number>
  onSuccess?: () => void
  search?: string
  sort?: boolean
  value?: Value | Value[]
}) => Promise<void>
