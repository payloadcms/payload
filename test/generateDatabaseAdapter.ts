import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { DatabaseAdapterType } from '@tools/test-utils/database'

import { generateDatabaseAdapter as generateDatabaseAdapterBase } from '@tools/test-utils/database'

export {
  allDatabaseAdapters,
  DatabaseAdapterType,
  defaultPostgresUrl,
  getCurrentDatabaseAdapter,
} from '@tools/test-utils/database'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Wrapper that writes to test/ directory for backwards compatibility
 */
export function generateDatabaseAdapter(dbAdapter: DatabaseAdapterType): string {
  return generateDatabaseAdapterBase(dbAdapter, dirname)
}
