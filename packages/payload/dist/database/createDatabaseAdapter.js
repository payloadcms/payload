import { defaultUpdateJobs } from './defaultUpdateJobs.js';
import { createMigration } from './migrations/createMigration.js';
import { migrate } from './migrations/migrate.js';
import { migrateDown } from './migrations/migrateDown.js';
import { migrateRefresh } from './migrations/migrateRefresh.js';
import { migrateReset } from './migrations/migrateReset.js';
import { migrateStatus } from './migrations/migrateStatus.js';
const beginTransaction = ()=>Promise.resolve(null);
// @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
const rollbackTransaction = ()=>Promise.resolve(null);
// @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
const commitTransaction = ()=>Promise.resolve(null);
export function createDatabaseAdapter(args) {
    return {
        // Default 'null' transaction functions
        // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
        beginTransaction,
        // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
        commitTransaction,
        createMigration,
        migrate,
        migrateDown,
        migrateFresh: ()=>Promise.resolve(null),
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
        bulkOperationsSingleTransaction: args.bulkOperationsSingleTransaction ?? false
    };
}

//# sourceMappingURL=createDatabaseAdapter.js.map