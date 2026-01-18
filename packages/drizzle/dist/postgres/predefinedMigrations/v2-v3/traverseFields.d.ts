import type { FlattenedField, Payload } from 'payload';
import type { BasePostgresAdapter, PostgresDB } from '../../types.js';
import type { PathsToQuery } from './types.js';
type Args = {
    adapter: BasePostgresAdapter;
    collectionSlug?: string;
    columnPrefix: string;
    db: PostgresDB;
    disableNotNull: boolean;
    fields: FlattenedField[];
    globalSlug?: string;
    isVersions: boolean;
    newTableName: string;
    parentTableName: string;
    path: string;
    pathsToQuery: PathsToQuery;
    payload: Payload;
    rootTableName: string;
};
export declare const traverseFields: (args: Args) => void;
export {};
//# sourceMappingURL=traverseFields.d.ts.map