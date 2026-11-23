import { sql } from 'drizzle-orm'
import { PgUUID } from 'drizzle-orm/pg-core'

import type { PostgresOperatorHandler } from '../types.js'

/**
 * Makes Postgres `contains`, `like`, and `not_like` text comparisons accent-insensitive by
 * wrapping both operands in `unaccent(...)`. Requires the `unaccent` extension to be installed in
 * the database - list it in the adapter's `extensions` option to have Payload install it for you.
 *
 * Skips native `uuid` columns: a default or custom UUID/UUIDv7 `id` field is reported as a
 * `text`-type field by Payload even though it is stored as a `uuid` column, so `fieldTypes`
 * alone cannot exclude it. A genuine custom `text`/`varchar` `id` column is not a `PgUUID`
 * column and still receives accent-insensitive matching.
 */
export const postgresUnaccent = (): PostgresOperatorHandler => ({
  name: 'postgres-unaccent',
  fieldTypes: ['text', 'textarea'],
  operators: ['contains', 'like', 'not_like'],
  requiredExtensions: ['unaccent'],
  transformOperands: ({ column, value }) => {
    if (column instanceof PgUUID) {
      return { column, value }
    }

    return {
      column: sql`unaccent(${column})`,
      value: sql`unaccent(${value})`,
    }
  },
})
