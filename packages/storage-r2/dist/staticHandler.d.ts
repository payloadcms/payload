import type { StaticHandler } from '@payloadcms/plugin-cloud-storage/types';
import type { CollectionConfig } from 'payload';
import type { R2Bucket } from './types.js';
interface Args {
    bucket: R2Bucket;
    collection: CollectionConfig;
    prefix?: string;
}
export declare const getHandler: ({ bucket, collection, prefix }: Args) => StaticHandler;
export {};
//# sourceMappingURL=staticHandler.d.ts.map