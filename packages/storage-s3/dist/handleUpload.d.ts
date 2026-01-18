import type * as AWS from '@aws-sdk/client-s3';
import type { HandleUpload } from '@payloadcms/plugin-cloud-storage/types';
import type { CollectionConfig } from 'payload';
interface Args {
    acl?: 'private' | 'public-read';
    bucket: string;
    collection: CollectionConfig;
    getStorageClient: () => AWS.S3;
    prefix?: string;
}
export declare const getHandleUpload: ({ acl, bucket, getStorageClient, prefix, }: Args) => HandleUpload;
export {};
//# sourceMappingURL=handleUpload.d.ts.map