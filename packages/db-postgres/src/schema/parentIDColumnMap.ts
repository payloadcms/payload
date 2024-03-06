import { integer, numeric, uuid, varchar } from 'drizzle-orm/pg-core'

import type { IDType } from '../types.d.ts'

export const parentIDColumnMap: Record<
  IDType,
  typeof integer<string> | typeof numeric<string> | typeof uuid<string> | typeof varchar
> = {
  integer,
  numeric,
  uuid,
  varchar,
}
