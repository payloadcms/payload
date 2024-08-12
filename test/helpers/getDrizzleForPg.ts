import type { PostgresAdapter } from '@payloadcms/db-postgres/types'

import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'

export const getDrizzlePg: PostgresAdapter['getDrizzle'] = async (args) => {
  const poolConfig: pg.PoolConfig = {
    connectionString: process.env.POSTGRES_URL || 'postgres://127.0.0.1:5432/payloadtests',
  }

  const pool = new pg.Pool(poolConfig)

  // Connect to the database
  await connectWithReconnect({ pool })

  // Return the drizzle instance
  return drizzle(pool, {
    schema: args.schema,
  })
}

/**
 * Utility for connecting and retrying if the connection fails
 */
const connectWithReconnect = async function ({
  pool,
  reconnect = false,
}: {
  pool: pg.Pool
  reconnect?: boolean
}) {
  let result

  if (!reconnect) {
    result = await pool.connect()
  } else {
    try {
      result = await pool.connect()
    } catch (err) {
      setTimeout(() => {
        void connectWithReconnect({ pool, reconnect: true })
      }, 1000)
    }
  }
  if (!result) {
    return
  }
  result.prependListener('error', (err) => {
    try {
      if (err.code === 'ECONNRESET') {
        void connectWithReconnect({ pool, reconnect: true })
      }
    } catch (err) {
      // swallow error
    }
  })
}
