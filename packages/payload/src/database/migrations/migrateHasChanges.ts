import type { DatabaseAdapter } from '../../index.js'

/**
 * Default implementation of migrateHasChanges that always returns false.
 */
// eslint-disable-next-line @typescript-eslint/require-await
export async function migrateHasChanges(this: DatabaseAdapter): Promise<boolean> {
  return false
}
