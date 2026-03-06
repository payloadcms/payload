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
// @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
const rollbackTransaction: RollbackTransaction = () => Promise.resolve(null)
// @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
const commitTransaction: CommitTransaction = () => Promise.resolve(null)

export function createDatabaseAdapter<T extends BaseDatabaseAdapter>(
  args: MarkOptional<
    T,
    | 'allowIDOnCreate'
    | 'bulkOperationsSingleTransaction'
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
    // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
    beginTransaction,
    // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
    commitTransaction,
    createMigration,
    migrate,
    migrateDown,
    migrateFresh: () => Promise.resolve(null),
    migrateRefresh,
    migrateReset,
    migrateStatus,
    // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
    rollbackTransaction,
    updateJobs: defaultUpdateJobs,

    ...args,
    // Ensure migrationDir is set
    migrationDir: args.migrationDir || 'migrations',
    // Set default for bulkOperationsSingleTransaction if not provided
    bulkOperationsSingleTransaction: args.bulkOperationsSingleTransaction ?? false,
  } as T
}
