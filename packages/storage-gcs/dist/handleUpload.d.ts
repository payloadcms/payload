import type { Storage } from '@google-cloud/storage';
import type { HandleUpload } from '@payloadcms/plugin-cloud-storage/types';
import type { CollectionConfig } from 'payload';
interface Args {
    acl?: 'Private' | 'Public';
    bucket: string;
    collection: CollectionConfig;
    getStorageClient: () => Storage;
    prefix?: string;
}
export declare const getHandleUpload: ({ acl, bucket, getStorageClient, prefix, }: Args) => HandleUpload;
export {};
//# sourceMappingURL=handleUpload.d.ts.map