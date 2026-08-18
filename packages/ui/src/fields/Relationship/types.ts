import type { I18nClient } from '@payloadcms/translations'
import type {
  ClientCollectionConfig,
  ClientConfig,
  CollectionSlug,
  FilterOptionsResult,
  LabelFunction,
  StaticDescription,
  StaticLabel,
  ValueWithRelation,
} from 'payload'

export type Option = {
  allowEdit: boolean
  /**
   * The document the option was built from, narrowed to the fields that were selected when it was
   * loaded. Present for callers that need more than the title, e.g. `formatOptionLabel`.
   */
  doc?: Record<string, unknown>
  label: string
  options?: Option[]
  relationTo?: string
  value: number | string
}

export type OptionGroup = {
  label: string
  options: Option[]
}

export type MonomorphicRelationValue = number | string

export type Value =
  | MonomorphicRelationValue
  | MonomorphicRelationValue[]
  | ValueWithRelation
  | ValueWithRelation[]

type CLEAR = {
  exemptValues?: ValueWithRelation | ValueWithRelation[]
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

export type HasManyValueUnion =
  | {
      hasMany: false
      value?: ValueWithRelation
    }
  | {
      hasMany: true
      value?: ValueWithRelation[]
    }

export type UpdateResults = (
  args: {
    filterOptions?: FilterOptionsResult
    lastFullyLoadedRelation?: number
    lastLoadedPage: Record<string, number>
    onSuccess?: () => void
    search?: string
    sort?: boolean
  } & HasManyValueUnion,
) => void

export type RelationshipInputProps = {
  readonly AfterInput?: React.ReactNode
  readonly allowCreate?: boolean
  readonly allowEdit?: boolean
  readonly appearance?: 'drawer' | 'select'
  readonly BeforeInput?: React.ReactNode
  readonly className?: string
  /**
   * Replaces the button rendered at the end of the input row, which creates a new related
   * document by default. Also suppresses that default button when provided.
   */
  readonly CreateButton?: React.ReactNode
  readonly Description?: React.ReactNode
  readonly description?: StaticDescription
  readonly Error?: React.ReactNode
  readonly filterOptions?: FilterOptionsResult
  readonly formatDisplayedOptions?: (options: OptionGroup[]) => Option[] | OptionGroup[]
  /**
   * Overrides the label of a single option. `context` is `'menu'` while browsing the dropdown and
   * `'value'` for the selected value(s), so extra detail can be shown only while browsing.
   */
  readonly formatOptionLabel?: (args: {
    context: 'menu' | 'value'
    defaultLabel: string
    doc?: Record<string, unknown>
  }) => string
  readonly isSortable?: boolean
  readonly Label?: React.ReactNode
  readonly label?: StaticLabel
  readonly localized?: boolean
  readonly maxResultsPerRequest?: number
  readonly maxRows?: number
  readonly minRows?: number
  readonly path: string
  readonly placeholder?: LabelFunction | string
  readonly readOnly?: boolean
  readonly relationTo: string[]
  readonly required?: boolean
  /**
   * Extra fields to select when loading options, merged with the collection's title field.
   * Required for virtual fields, which are only computed when explicitly selected.
   */
  readonly selectOptionFields?: Record<string, boolean>
  readonly showError?: boolean
  /**
   * Controls the height of the input. Defaults to `'large'`.
   */
  readonly size?: 'large' | 'medium'
  readonly sortOptions?: Partial<Record<CollectionSlug, string>>
  readonly style?: React.CSSProperties
} & SharedRelationshipInputProps

type SharedRelationshipInputProps =
  | {
      readonly hasMany: false
      readonly initialValue?: null | ValueWithRelation
      readonly onChange: (value: ValueWithRelation) => void
      readonly value?: null | ValueWithRelation
    }
  | {
      readonly hasMany: true
      readonly initialValue?: null | ValueWithRelation[]
      readonly onChange: (value: ValueWithRelation[]) => void
      readonly value?: null | ValueWithRelation[]
    }
