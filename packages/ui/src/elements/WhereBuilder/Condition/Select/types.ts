import type { Option, SelectFieldClient } from 'payload'

import type { DefaultFilterProps } from '../types.js'

export type SelectFilterProps = {
  readonly field: SelectFieldClient
  readonly isClearable?: boolean
  readonly onChange: (val: string) => void
  readonly options: Option[]
  readonly value: string
} & DefaultFilterProps
