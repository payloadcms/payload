// @ts-strict-ignore
import type { MarkOptional } from 'ts-essentials'

import type {
  BaseDatabaseAdapter,
  BeginTransaction,
  CommitTransaction,
  RollbackTransaction,
} from './types.js'

import { defaultUpdateJobs } from './defaultUpdateJobs.js'
import { createMigration } from './migrations/createMigration.js'
import { migrate } from './migrations/migrate.js'
import { migrateDown } from './migrations/migrateDown.js'
import { migrateRefresh } from './migrations/migrateRefresh.js'
import { migrateReset } from './migrations/migrateReset.js'
import { migrateStatus } from './migrations/migrateStatus.js'

const beginTransaction: BeginTransaction = () => Promise.resolve(null)
const rollbackTransaction: RollbackTransaction = () => Promise.resolve(null)
const commitTransaction: CommitTransaction = () => Promise.resolve(null)

export function createDatabaseAdapter<T extends BaseDatabaseAdapter>(
  args: MarkOptional<
    T,
    | 'allowIDOnCreate'
    | 'createMigration'
    | 'migrate'
    | 'migrateDown'
    | 'migrateFresh'
    | 'migrateRefresh'
    | 'migrateReset'
    | 'migrateStatus'
    | 'migrationDir'
    | 'updateJobs'
  >,
): T {
  return {
    // Default 'null' transaction functions
    beginTransaction,
    commitTransaction,
    createMigration,
    migrate,
    migrateDown,
    migrateFresh: () => Promise.resolve(null),
    migrateRefresh,
    migrateReset,
    migrateStatus,
    rollbackTransaction,
    updateJobs: defaultUpdateJobs,

    ...args,
    // Ensure migrationDir is set
    migrationDir: args.migrationDir || 'migrations',
  } as T
}
