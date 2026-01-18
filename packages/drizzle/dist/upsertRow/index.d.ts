import type { TypeWithID } from 'payload';
import type { Args } from './types.js';
/**
 * If `id` is provided, it will update the row with that ID.
 * If `where` is provided, it will update the row that matches the `where`
 * If neither `id` nor `where` is provided, it will create a new row.
 *
 * adapter function replaces the entire row and does not support partial updates.
 */
export declare const upsertRow: <T extends Record<string, unknown> | TypeWithID>({ id, adapter, collectionSlug, data, db, fields, globalSlug, ignoreResult, joinQuery: _joinQuery, operation, path, req, select, tableName, upsertTarget, where, }: Args) => Promise<T>;
//# sourceMappingURL=index.d.ts.map