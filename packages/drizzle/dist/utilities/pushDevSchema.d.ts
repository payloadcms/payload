import type { DrizzleAdapter } from '../types.js';
/**
 * Pushes the development schema to the database using Drizzle.
 *
 * @param {DrizzleAdapter} adapter - The PostgresAdapter instance connected to the database.
 * @returns {Promise<void>} - A promise that resolves once the schema push is complete.
 */
export declare const pushDevSchema: (adapter: DrizzleAdapter) => Promise<void>;
//# sourceMappingURL=pushDevSchema.d.ts.map