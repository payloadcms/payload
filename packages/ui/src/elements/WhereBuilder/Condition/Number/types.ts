import type { NumberFieldClient } from 'payload'

import type { DefaultFilterProps } from '../types.js'

export type NumberFilterProps = DefaultFilterProps & {
  readonly field: NumberFieldClient
  readonly onChange: (e: string) => void
  readonly value: number | number[]
}
