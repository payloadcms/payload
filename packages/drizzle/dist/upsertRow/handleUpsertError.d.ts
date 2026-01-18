import type { PayloadRequest } from 'payload';
import type { DrizzleAdapter } from '../types.js';
type HandleUpsertErrorArgs = {
    adapter: DrizzleAdapter;
    collectionSlug?: string;
    error: unknown;
    globalSlug?: string;
    id?: number | string;
    req?: Partial<PayloadRequest>;
    tableName: string;
};
/**
 * Handles unique constraint violation errors from PostgreSQL and SQLite,
 * converting them to Payload ValidationErrors.
 * Re-throws non-constraint errors unchanged.
 */
export declare const handleUpsertError: ({ id, adapter, collectionSlug, error: caughtError, globalSlug, req, tableName, }: HandleUpsertErrorArgs) => never;
export {};
//# sourceMappingURL=handleUpsertError.d.ts.map