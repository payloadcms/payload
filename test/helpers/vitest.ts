import type { SuiteFactory, TestFunction } from 'vitest'

import { describe as vitestDescribe, it as vitestIt } from 'vitest'

import { type DatabaseAdapterType, getCurrentDatabaseAdapter } from '../generateDatabaseAdapter.js'
import { mongooseList } from './isMongoose.js'

type ItOptions = {
  /**
   * Specify which database(s) the test should run on.
   * - 'all': Run on all databases (default)
   * - 'drizzle': Run only on Drizzle (Postgres/SQLite)
   * - 'mongo': Run only on MongoDB
   * - function: Custom function that receives the current adapter type and returns a boolean indicating whether to run the test.
   */
  db?: 'all' | 'drizzle' | 'mongo' | ((adapterType: DatabaseAdapterType) => boolean)
}

const isMongo = mongooseList.includes(process.env.PAYLOAD_DATABASE!)

/**
 * Custom `it` wrapper that supports database-specific test execution.
 *
 * @example
 * // Run only on Drizzle (Postgres/SQLite)
 * it('drizzle-specific test', { db: 'drizzle' }, async () => { ... })
 *
 * // Run only on MongoDB
 * it('mongo-specific test', { db: 'mongo' }, async () => { ... })
 *
 * // Run on all databases (default)
 * it('universal test', async () => { ... })
 */
const itWithOptions = (
  name: string,
  optionsOrFn?: ItOptions | TestFunction,
  fn?: TestFunction,
): ReturnType<typeof vitestIt> => {
  // Handle overloads: it(name, fn) or it(name, options, fn)
  const options: ItOptions | undefined = typeof optionsOrFn === 'object' ? optionsOrFn : undefined
  const testFn: TestFunction | undefined = typeof optionsOrFn === 'function' ? optionsOrFn : fn

  const db = options?.db ?? 'all'

  if (typeof db === 'function') {
    if (!db(getCurrentDatabaseAdapter())) {
      return vitestIt.skip(name, testFn)
    }

    return vitestIt(name, testFn)
  }

  if (db === 'drizzle' && isMongo) {
    return vitestIt.skip(name, testFn)
  }
  if (db === 'mongo' && !isMongo) {
    return vitestIt.skip(name, testFn)
  }
  return vitestIt(name, testFn)
}

// Add skip property for compatibility
itWithOptions.skip = vitestIt.skip

// Needs to be called `it` for the vitest vs code extension to recognize it as a test function
export const it = itWithOptions

/**
 * Custom `describe` wrapper that supports database-specific suite execution.
 *
 * @example
 * // Run only on Drizzle (Postgres/SQLite)
 * describe('drizzle-specific suite', { db: 'drizzle' }, () => { ... })
 *
 * // Run only on MongoDB
 * describe('mongo-specific suite', { db: 'mongo' }, () => { ... })
 *
 * // Run on all databases (default)
 * describe('universal suite', () => { ... })
 */
const describeWithOptions = (
  name: string,
  optionsOrFn?: ItOptions | SuiteFactory,
  fn?: SuiteFactory,
): ReturnType<typeof vitestDescribe> => {
  // Handle overloads: describe(name, fn) or describe(name, options, fn)
  const options: ItOptions | undefined = typeof optionsOrFn === 'object' ? optionsOrFn : undefined
  const suiteFn: SuiteFactory | undefined = typeof optionsOrFn === 'function' ? optionsOrFn : fn

  const db = options?.db ?? 'all'

  if (typeof db === 'function') {
    if (!db(getCurrentDatabaseAdapter())) {
      return vitestDescribe.skip(name, suiteFn)
    }
    return vitestDescribe(name, suiteFn)
  }

  if (db === 'drizzle' && isMongo) {
    return vitestDescribe.skip(name, suiteFn)
  }
  if (db === 'mongo' && !isMongo) {
    return vitestDescribe.skip(name, suiteFn)
  }
  return vitestDescribe(name, suiteFn)
}

// Add skip property for compatibility
describeWithOptions.skip = vitestDescribe.skip

// Needs to be called `describe` for the vitest vs code extension to recognize it
export const describe = describeWithOptions

// Re-export for convenience
export { isMongo }
