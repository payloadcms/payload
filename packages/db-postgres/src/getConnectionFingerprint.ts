import type { PoolConfig } from 'pg'

import { createHash } from 'node:crypto'

/**
 * Returns a stable hash identifying the connection target (no secrets exposed).
 * Used in schema version so that when DATABASE_URL or pool config changes we re-push schema.
 */
export function getConnectionFingerprint(poolOptions?: PoolConfig): string {
  if (!poolOptions) {
    return ''
  }

  let raw: string
  if (poolOptions.connectionString) {
    try {
      const url = new URL(poolOptions.connectionString)
      url.password = ''
      raw = url.toString()
    } catch {
      raw = poolOptions.connectionString
    }
  } else {
    raw = JSON.stringify(poolOptions)
  }

  return createHash('sha256').update(raw).digest('hex')
}
