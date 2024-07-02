import type { PgColumnBuilder } from 'drizzle-orm/pg-core'
import type { NumberField } from 'payload'

import { bigint, integer, numeric, real } from 'drizzle-orm/pg-core'

type NumberFieldDbType = NonNullable<NumberField['dbType']>

export const numberColumnMap: Record<NumberFieldDbType, (name: string) => PgColumnBuilder> = {
  bigint: (name: string) => {
    return bigint(name, { mode: 'number' })
  },
  integer,
  numeric,
  real,
}
