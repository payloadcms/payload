import type { Payload } from '../../index.js';
import type { MigrationData } from '../types.js';
/**
 * Gets all existing migrations from the database, excluding the dev migration
 */
export declare function getMigrations({ payload, }: {
    payload: Payload;
}): Promise<{
    existingMigrations: MigrationData[];
    latestBatch: number;
}>;
//# sourceMappingURL=getMigrations.d.ts.map