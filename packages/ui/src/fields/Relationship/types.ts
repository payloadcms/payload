import type { I18nClient } from '@payloadcms/translations'
import type {
  ClientCollectionConfig,
  ClientConfig,
  CollectionSlug,
  FilterOptionsResult,
  StaticDescription,
  StaticLabel,
} from 'payload'

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

export type RelationshipInputProps = {
  readonly AfterInput: React.ReactNode // optional
  readonly allowCreate: boolean // optional
  readonly allowEdit: boolean // optional
  readonly appearance: 'drawer' | 'select' // optional
  readonly BeforeInput: React.ReactNode // optional
  readonly className: string // optional
  readonly Description: React.ReactNode // optional
  readonly description: StaticDescription // optional
  readonly Error: React.ReactNode // optional
  readonly filterOptions: FilterOptionsResult // optional
  readonly initialValue: Value | Value[] // optional
  readonly isPolymorphic: boolean
  readonly isSortable: boolean // optional
  readonly Label: React.ReactNode // optional
  readonly label: StaticLabel // optional
  readonly localized: boolean // optional
  readonly maxResultsPerRequest: number // optional
  readonly maxRows: number // optional
  readonly minRows: number // optional
  readonly path: string
  readonly readOnly: boolean // optional
  readonly relationTo: string[]
  readonly required: boolean // optional
  readonly showError: boolean // optional
  readonly sortOptions: Partial<Record<CollectionSlug, string>> // optional
  readonly style: React.CSSProperties // optional
} & SharedRelationshipInputProps

type SharedRelationshipInputProps =
  | {
      readonly hasMany: false
      readonly onChange: (value: ValueWithRelation, modifyForm?: boolean) => void
      readonly value?: null | ValueWithRelation
    }
  | {
      readonly hasMany: true
      readonly onChange: (value: ValueWithRelation[], modifyForm?: boolean) => void
      readonly value?: null | ValueWithRelation[]
    }
