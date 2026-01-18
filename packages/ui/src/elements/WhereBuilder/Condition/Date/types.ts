import type { DateFieldClient } from '@ruya.sa/payload'

import type { DefaultFilterProps } from '../types.js'

export type DateFilterProps = {
  readonly field: DateFieldClient
  readonly value: Date | string
} & DefaultFilterProps
