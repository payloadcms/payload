import type { Operator, Where } from 'payload'

import type { Action, ConditionOption } from '../types.js'

export type Props = {
  andIndex: number
  dispatch: (action: Action) => void
  fields: ConditionOption[]
  orIndex: number
  value: Where
}

export type DefaultFilterProps = {
  readonly disabled: boolean
  readonly onChange: (val: any) => void
  readonly operator: Operator
  readonly value: unknown
}
