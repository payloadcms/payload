import type { FlattenedField, Where } from 'payload';
import type { MongooseAdapter } from '../index.js';
export declare const buildQuery: ({ adapter, collectionSlug, fields, globalSlug, locale, where, }: {
    adapter: MongooseAdapter;
    collectionSlug?: string;
    fields: FlattenedField[];
    globalSlug?: string;
    locale?: string;
    where: Where;
}) => Promise<Record<string, unknown>>;
//# sourceMappingURL=buildQuery.d.ts.map