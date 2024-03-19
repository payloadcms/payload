import type { Where } from 'payload/types'

import type { Action, FieldCondition } from '../index.js'

export type Props = {
  andIndex: number
  dispatch: (action: Action) => void
  fields: FieldCondition[]
  orIndex: number
  value: Where
}
