import type { DrizzleAdapter } from '../types.js'

/**
 * Applies limit/offset pagination to a select query in a dialect-aware way.
 *
 * Postgres and SQLite use `LIMIT ... OFFSET ...`. SQL Server has no `LIMIT`; it uses
 * `OFFSET <n> ROWS FETCH NEXT <m> ROWS ONLY`, which additionally requires an `ORDER BY` on the
 * query (callers apply one before calling this) and requires `OFFSET` to be present whenever
 * `FETCH` is used.
 */
export const applyPagination = <T>(
  adapter: DrizzleAdapter,
  query: T,
  { limit, offset }: { limit?: number; offset?: number },
): T => {
  const q = query as any

  if (adapter.name === 'mssql') {
    let next = q.offset(offset ?? 0)
    if (limit) {
      next = next.fetch(limit)
    }
    return next as T
  }

  let next = q
  if (typeof offset !== 'undefined') {
    next = next.offset(offset)
  }
  if (typeof limit !== 'undefined') {
    next = next.limit(limit)
  }
  return next as T
}
