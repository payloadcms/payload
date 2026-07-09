import type {
  ClientField,
  Operator,
  ResolvedFilterOptions,
  SanitizedCollectionConfig,
  Where,
} from 'payload'

export type WhereBuilderProps = {
  readonly collectionPluralLabel?: SanitizedCollectionConfig['labels']['plural']
  readonly collectionSlug: SanitizedCollectionConfig['slug']
  readonly fields: ClientField[]
  /** Called with the next `where` value whenever a condition is added, edited, or removed. */
  readonly onChange: (where: Where) => Promise<void> | void
  /** Called when the last condition is removed, so the parent has empty state control. */
  readonly onEmptyRemove?: () => void
  readonly renderedFilters?: Map<string, React.ReactNode>
  readonly resolvedFilterOptions?: Map<string, ResolvedFilterOptions>
  /** The current `where` value to render conditions from. */
  readonly value?: Where
}

export type Value = Date | number | number[] | string | string[]

export type ReducedField = {
  field: ClientField
  /** The field path (e.g. "title" or "author.name") */
  fieldPath: string
  label: React.ReactNode
  operators: {
    label: string
    value: Operator
  }[]
  plainTextLabel?: string
}

export type Relation = 'and' | 'or'

export type ADD = {
  andIndex?: number
  field: string
  orIndex?: number
  relation?: Relation
  type: 'add'
}

export type REMOVE = {
  andIndex: number
  orIndex: number
  type: 'remove'
}

export type UPDATE = {
  andIndex: number
  field?: string
  operator?: string
  orIndex: number
  type: 'update'
  value?: unknown
}

export type Action = ADD | REMOVE | UPDATE

export type State = {
  or: Where[]
}

export type AddCondition = ({
  andIndex,
  field,
  orIndex,
  relation,
}: {
  andIndex: number
  field: ReducedField
  orIndex: number
  relation: 'and' | 'or'
}) => Promise<void> | void

export type UpdateCondition = ({
  type,
  andIndex,
  field,
  operator,
  orIndex,
  value,
}: {
  andIndex: number
  field: ReducedField
  operator: string
  orIndex: number
  type: 'field' | 'operator' | 'value'
  value: Value
}) => Promise<void> | void

export type RemoveCondition = ({
  andIndex,
  orIndex,
}: {
  andIndex: number
  orIndex: number
}) => Promise<void> | void

export type UpdateJoin = ({
  andIndex,
  join,
  orIndex,
}: {
  andIndex: number
  join: Relation
  orIndex: number
}) => Promise<void> | void
