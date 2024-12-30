import type { I18nClient } from '@payloadcms/translations'
import type { ClientCollectionConfig, ClientConfig, FilterOptionsResult } from 'payload'

export type Option = {
  allowEdit: boolean
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

export type Value = number | string | ValueWithRelation

type CLEAR = {
  exemptValues?: Value | Value[]
  type: 'CLEAR'
}

type UPDATE = {
  collection: ClientCollectionConfig
  config: ClientConfig
  doc: any
  i18n: I18nClient
  type: 'UPDATE'
}

type ADD = {
  collection: ClientCollectionConfig
  config: ClientConfig
  docs: any[]
  i18n: I18nClient
  ids?: (number | string)[]
  sort?: boolean
  type: 'ADD'
}

type REMOVE = {
  collection: ClientCollectionConfig
  config: ClientConfig
  i18n: I18nClient
  id: string
  type: 'REMOVE'
}

export type Action = ADD | CLEAR | REMOVE | UPDATE

export type GetResults = (args: {
  filterOptions?: FilterOptionsResult
  lastFullyLoadedRelation?: number
  lastLoadedPage: Record<string, number>
  onSuccess?: () => void
  search?: string
  sort?: boolean
  value?: Value | Value[]
}) => Promise<void>
