import type { MarkOptional } from 'ts-essentials';
import type { BaseDatabaseAdapter } from './types.js';
export declare function createDatabaseAdapter<T extends BaseDatabaseAdapter>(args: MarkOptional<T, 'allowIDOnCreate' | 'bulkOperationsSingleTransaction' | 'createMigration' | 'migrate' | 'migrateDown' | 'migrateFresh' | 'migrateRefresh' | 'migrateReset' | 'migrateStatus' | 'migrationDir' | 'updateJobs'>): T;
//# sourceMappingURL=createDatabaseAdapter.d.ts.map