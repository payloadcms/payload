import type { PoolConfig } from 'pg'

/**
 * Returns a stable string identifying the connection target (no secrets).
 * Used in schema version so that when DATABASE_URL or pool config changes we re-push schema.
 */
export function getConnectionFingerprint(poolOptions?: PoolConfig): string {
  if (!poolOptions) {
    return ''
  }

  if (poolOptions.connectionString) {
    try {
      const url = new URL(poolOptions.connectionString)
      url.password = ''
      return url.toString()
    } catch {
      return poolOptions.connectionString.replace(/:[^:@]+@/, ':****@')
    }
  }

  const { database, host, port, user } = poolOptions
  return JSON.stringify({ database, host, port, user })
}
