import type { DateFieldClient } from 'payload'

import type { DefaultFilterProps } from '../types.js'

export type Props = {
  readonly field: DateFieldClient
  readonly value: Date | string
} & DefaultFilterProps
