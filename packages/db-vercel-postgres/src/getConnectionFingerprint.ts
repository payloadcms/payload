import type { VercelPostgresPoolConfig } from '@vercel/postgres'

/**
 * Returns a stable string identifying the connection target (no secrets).
 * Used in schema version so that when connection config or POSTGRES_URL changes we re-push schema.
 */
export function getConnectionFingerprint(
  poolOptions?: VercelPostgresPoolConfig,
  envConnectionString?: string,
): string {
  const connectionString =
    poolOptions?.connectionString ??
    (typeof envConnectionString === 'string' ? envConnectionString : undefined)

  if (connectionString) {
    try {
      const url = new URL(connectionString)
      url.password = ''
      return url.toString()
    } catch {
      return connectionString.replace(/:[^:@]+@/, ':****@')
    }
  }

  const { database, host, port, user } = poolOptions ?? {}
  return JSON.stringify({ database, host, port, user })
}
