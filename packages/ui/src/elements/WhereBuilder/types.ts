import type { Field, Operator, SanitizedCollectionConfig, Where } from 'payload'

export type WhereBuilderProps = {
  collectionPluralLabel: SanitizedCollectionConfig['labels']['plural']
  collectionSlug: SanitizedCollectionConfig['slug']
}

export type FieldCondition = {
  component?: string
  label: string
  operators: {
    label: string
    value: Operator
  }[]
  props: Field
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
