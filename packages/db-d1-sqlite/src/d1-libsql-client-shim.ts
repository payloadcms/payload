import type { AnyD1Database } from 'drizzle-orm/d1'

function getRowsFromD1AllResult(result: unknown): Record<string, unknown>[] {
  if (Array.isArray(result)) {
    return result as Record<string, unknown>[]
  }

  if (
    result &&
    typeof result === 'object' &&
    'results' in result &&
    Array.isArray((result as { results: unknown }).results)
  ) {
    return (result as { results: Record<string, unknown>[] }).results
  }

  return []
}

/**
 * `dropDatabase` in `@payloadcms/drizzle/sqlite` expects a libsql client (`execute`, `executeMultiple`).
 * Cloudflare D1 (Workers binding and HTTP REST) exposes `prepare` / `exec` instead. This shim bridges the two.
 */
export function createD1LibsqlClientShim(client: AnyD1Database) {
  return {
    async execute(sql: string) {
      const result = await client.prepare(sql).all()
      const rows = getRowsFromD1AllResult(result)

      return { rows }
    },

    async executeMultiple(sql: string) {
      await client.exec(sql)
    },
  }
}
