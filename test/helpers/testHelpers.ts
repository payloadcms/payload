import { it as vitestIt } from 'vitest'

import { mongooseList } from './isMongoose.js'

type TestOptions = {
  /** Which database adapter(s) this test should run on. Defaults to 'all'. */
  db?: 'all' | 'drizzle' | 'mongo'
}

const isMongo = mongooseList.includes(process.env.PAYLOAD_DATABASE!)

/**
 * Custom `it` wrapper that supports database-specific test execution.
 *
 * @example
 * // Run only on Drizzle (Postgres/SQLite)
 * it('drizzle-specific test', async () => { ... }, { db: 'drizzle' })
 *
 * // Run only on MongoDB
 * it('mongo-specific test', async () => { ... }, { db: 'mongo' })
 *
 * // Run on all databases (default)
 * it('universal test', async () => { ... })
 */
const itWithOptions = (
  name: string,
  fn: () => Promise<void> | void,
  options?: TestOptions,
): ReturnType<typeof vitestIt> => {
  const db = options?.db ?? 'all'

  if (db === 'drizzle' && isMongo) {
    return vitestIt.skip(name, fn)
  }
  if (db === 'mongo' && !isMongo) {
    return vitestIt.skip(name, fn)
  }
  return vitestIt(name, fn)
}

// Add skip property for compatibility
itWithOptions.skip = vitestIt.skip

// Needs to be called `it` for the vitest vs code extension to recognize it as a test function
export const it = itWithOptions

// Re-export for convenience
export { isMongo }
