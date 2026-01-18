import type { FlattenedField, Payload, PayloadRequest } from 'payload';
import type { BasePostgresAdapter, PostgresDB } from '../../../types.js';
import type { DocsToResave } from '../types.js';
type Args = {
    adapter: BasePostgresAdapter;
    collectionSlug?: string;
    db: PostgresDB;
    debug: boolean;
    docsToResave: DocsToResave;
    fields: FlattenedField[];
    globalSlug?: string;
    isVersions: boolean;
    payload: Payload;
    req?: Partial<PayloadRequest>;
    tableName: string;
};
export declare const fetchAndResave: ({ adapter, collectionSlug, db, debug, docsToResave, fields, globalSlug, isVersions, payload, req, tableName, }: Args) => Promise<void>;
export {};
//# sourceMappingURL=index.d.ts.map