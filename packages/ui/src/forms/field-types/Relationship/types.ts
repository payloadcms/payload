import { I18n } from '@payloadcms/translations'
import type { SanitizedCollectionConfig } from 'payload/types'
import type { SanitizedConfig } from 'payload/types'
import type { RelationshipField } from 'payload/types'
import type { Where } from 'payload/types'

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
  i18n: I18n
  type: 'UPDATE'
}

type ADD = {
  collection: SanitizedCollectionConfig
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

export type FilterOptionsResult = {
  [relation: string]: Where | boolean
}
