import type { HandleUpload } from '@payloadcms/plugin-cloud-storage/types';
import type { CollectionConfig } from 'payload';
import type { R2Bucket } from './types.js';
interface Args {
    bucket: R2Bucket;
    collection: CollectionConfig;
    prefix?: string;
}
export declare const getHandleUpload: ({ bucket, prefix }: Args) => HandleUpload;
export {};
//# sourceMappingURL=handleUpload.d.ts.map