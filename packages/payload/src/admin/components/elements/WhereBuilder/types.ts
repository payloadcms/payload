import type { SanitizedCollectionConfig } from '../../../../collections/config/types'
import type { Field } from '../../../../fields/config/types'
import type { Operator, Where } from '../../../../types'

export type Props = {
  collection: SanitizedCollectionConfig
  handleChange?: (where: Where) => void
  modifySearchQuery?: boolean
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
