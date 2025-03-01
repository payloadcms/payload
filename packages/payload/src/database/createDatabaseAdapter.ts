import type { MarkOptional } from 'ts-essentials'

import type {
  BaseDatabaseAdapter,
  BeginTransaction,
  CommitTransaction,
  RollbackTransaction,
} from './types.js'

import { createMigration } from './migrations/createMigration.js'
import { migrate } from './migrations/migrate.js'
import { migrateDown } from './migrations/migrateDown.js'
import { migrateRefresh } from './migrations/migrateRefresh.js'
import { migrateReset } from './migrations/migrateReset.js'
import { migrateStatus } from './migrations/migrateStatus.js'

const beginTransaction: BeginTransaction = async () => null
const rollbackTransaction: RollbackTransaction = async () => null
const commitTransaction: CommitTransaction = async () => null

export function createDatabaseAdapter<T extends BaseDatabaseAdapter>(
  args: MarkOptional<
    T,
    | 'createMigration'
    | 'migrate'
    | 'migrateDown'
    | 'migrateFresh'
    | 'migrateRefresh'
    | 'migrateReset'
    | 'migrateStatus'
    | 'migrationDir'
  >,
): T {
  return {
    // Default 'null' transaction functions
    beginTransaction,
    commitTransaction,
    createMigration,
    migrate,
    migrateDown,
    migrateFresh: async ({ forceAcceptWarning = null }) => null,
    migrateRefresh,
    migrateReset,
    migrateStatus,
    rollbackTransaction,

    ...args,

    // Ensure migrationDir is set
    migrationDir: args.migrationDir || 'migrations',
  } as T
}
