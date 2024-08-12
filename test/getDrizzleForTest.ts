import type { DrizzleAdapter } from '@payloadcms/drizzle/types'

import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'

// eslint-disable-next-line @typescript-eslint/require-await
export const getDrizzlePg: DrizzleAdapter['getDrizzle'] = async (args) => {
  const poolConfig: pg.PoolConfig = {
    // Customize the pool configuration here
  }
  const pool = new pg.Pool(poolConfig)

  return drizzle(pool, {
    schema: args.schema,
  })
}
