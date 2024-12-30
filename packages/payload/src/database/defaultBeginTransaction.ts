import type { BeginTransaction } from './types.js'

/**
 * Default implementation of `beginTransaction` that returns a resolved promise of null
 */
export function defaultBeginTransaction(): BeginTransaction {
  const promiseSingleton: Promise<null> = Promise.resolve(null)
  return () => promiseSingleton
}
