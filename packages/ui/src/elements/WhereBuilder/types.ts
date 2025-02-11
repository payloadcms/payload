import type { ClientField, Operator, SanitizedCollectionConfig, Where } from 'payload'

export type WhereBuilderProps = {
  readonly collectionPluralLabel: SanitizedCollectionConfig['labels']['plural']
  readonly collectionSlug: SanitizedCollectionConfig['slug']
  readonly fields?: ClientField[]
  readonly renderedFilters?: Map<string, React.ReactNode>
}

export type ReducedField = {
  field: ClientField
  label: React.ReactNode
  operators: {
    label: string
    value: Operator
  }[]
  value: string
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
}) => void

export type UpdateCondition = ({
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
  value: string
}) => void
