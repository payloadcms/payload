import type React from 'react'

import type { Action, OptionGroup, Value } from '../types.js'

export type Props = {
  dispatchOptions: React.Dispatch<Action>
  hasMany: boolean
  options: OptionGroup[]
  path: string
  relationTo: string | string[]
  setValue: (value: unknown) => void
  value: Value | Value[]
}
