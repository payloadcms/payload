/**
 * Rewrites `DROP CONSTRAINT` and `DROP INDEX` statements emitted by drizzle-kit so they
 * include `IF EXISTS`. Postgres resolves dependent foreign keys when a referenced table
 * is dropped with `CASCADE`, which causes follow-up explicit drops in the same migration
 * to fail. Making these drops idempotent keeps the generated up/down migrations runnable
 * end-to-end.
 *
 * Only rewrites statements that don't already contain `IF EXISTS` to stay safe against
 * future drizzle-kit output changes.
 */
export const makePostgresDropsIdempotent = (statements: string[]): string[] =>
  statements.map((statement) => {
    let next = statement.replace(
      /\bDROP CONSTRAINT\b(?! IF EXISTS\b)/gi,
      'DROP CONSTRAINT IF EXISTS',
    )

    next = next.replace(/\bDROP INDEX\b(?! IF EXISTS\b)/gi, 'DROP INDEX IF EXISTS')

    return next
  })
