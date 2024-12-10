import type { TextFieldClient } from 'payload'

import type { DefaultFilterProps } from '../types.js'

export type Props = {
  readonly field: TextFieldClient
  readonly onChange: (val: string) => void
  readonly value: string
} & DefaultFilterProps
