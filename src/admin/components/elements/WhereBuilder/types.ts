import { CollectionConfig } from '../../../../collections/config/types';
import { Field } from '../../../../fields/config/types';
import { Operator } from '../../../../types';

export type Props = {
  handleChange: (controls: any) => void,
  collection: CollectionConfig,
}

export type FieldCondition = {
  label: string
  value: string
  operators: {
    label: string
    value: Operator
  }[]
  component: string
  props: Field
}

export type Relation = 'and' | 'or'

export type ADD = {
  type: 'add'
  relation?: Relation
  andIndex?: number
  orIndex?: number
}

export type REMOVE = {
 type: 'remove'
 andIndex: number
 orIndex: number
}

export type UPDATE = {
  type: 'update'
  andIndex: number
  orIndex: number
  operator?: string
  field?: string
  value?: unknown
}

export type Action = ADD | REMOVE | UPDATE

export type AndClause = {
  operator?: string
  value?: unknown
  field?: string
}

export type OrClause = AndClause[]
