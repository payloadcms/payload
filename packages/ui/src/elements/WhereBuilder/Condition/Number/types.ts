import type { NumberFieldClient } from 'payload'

import type { DefaultFilterProps } from '../types.js'

export type Props = {
  readonly field: NumberFieldClient
  readonly onChange: (e: string) => void
  readonly value: string
} & DefaultFilterProps
