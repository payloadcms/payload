import type { Option, SelectFieldClient } from 'payload'

import type { DefaultFilterProps } from '../types.js'

export type Props = {
  readonly field: SelectFieldClient
  readonly onChange: (val: string) => void
  readonly options: Option[]
  readonly value: string
} & DefaultFilterProps
