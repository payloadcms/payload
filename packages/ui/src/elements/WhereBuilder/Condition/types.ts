import type { Where } from '../../../../../types'
import type { Action, FieldCondition } from '../types'

export type Props = {
  andIndex: number
  dispatch: (action: Action) => void
  fields: FieldCondition[]
  orIndex: number
  value: Where
}
