import type { ClientUploadsAccess } from '@payloadcms/plugin-cloud-storage/types';
import type { PayloadHandler } from 'payload';
import * as AWS from '@aws-sdk/client-s3';
import type { S3StorageOptions } from './index.js';
interface Args {
    access?: ClientUploadsAccess;
    acl?: 'private' | 'public-read';
    bucket: string;
    collections: S3StorageOptions['collections'];
    getStorageClient: () => AWS.S3;
}
export declare const getGenerateSignedURLHandler: ({ access, acl, bucket, collections, getStorageClient, }: Args) => PayloadHandler;
export {};
//# sourceMappingURL=generateSignedURL.d.ts.map