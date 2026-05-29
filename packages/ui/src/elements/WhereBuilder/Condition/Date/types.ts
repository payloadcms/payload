import type { DateFieldClient } from 'payload'

import type { DefaultFilterProps } from '../types.js'

export type DateFilterProps = DefaultFilterProps & {
  readonly field: DateFieldClient
  readonly value: Date | string
}
