import type { FlattenedField, Payload, PayloadRequest } from 'payload';
import type { BasePostgresAdapter, PostgresDB } from '../../types.js';
import type { PathsToQuery } from './types.js';
type Args = {
    adapter: BasePostgresAdapter;
    collectionSlug?: string;
    db: PostgresDB;
    debug: boolean;
    fields: FlattenedField[];
    globalSlug?: string;
    isVersions: boolean;
    pathsToQuery: PathsToQuery;
    payload: Payload;
    req?: Partial<PayloadRequest>;
    tableName: string;
};
export declare const migrateRelationships: ({ adapter, collectionSlug, db, debug, fields, globalSlug, isVersions, pathsToQuery, payload, req, tableName, }: Args) => Promise<void>;
export {};
//# sourceMappingURL=migrateRelationships.d.ts.map