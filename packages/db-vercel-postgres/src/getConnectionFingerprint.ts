import type { VercelPostgresPoolConfig } from '@vercel/postgres'

import { createHash } from 'node:crypto'

/**
 * Returns a stable hash identifying the connection target (no secrets exposed).
 * Used in schema version so that when connection config or POSTGRES_URL changes we re-push schema.
 */
export function getConnectionFingerprint(
  poolOptions?: VercelPostgresPoolConfig,
  envConnectionString?: string,
): string {
  let raw = ''

  const connectionString =
    poolOptions?.connectionString ??
    (typeof envConnectionString === 'string' ? envConnectionString : undefined)

  if (connectionString) {
    try {
      const url = new URL(connectionString)
      url.password = ''
      raw = url.toString()
    } catch {
      raw = connectionString
    }
  } else {
    // VercelPostgresPoolConfig omits database/host/port/user; fingerprint whatever options exist
    raw = JSON.stringify(poolOptions ?? {})
  }

  return createHash('sha256').update(raw).digest('hex')
}
