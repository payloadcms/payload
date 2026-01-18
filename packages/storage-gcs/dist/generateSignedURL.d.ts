import type { Storage } from '@google-cloud/storage';
import type { ClientUploadsAccess } from '@payloadcms/plugin-cloud-storage/types';
import type { PayloadHandler } from 'payload';
import type { GcsStorageOptions } from './index.js';
interface Args {
    access?: ClientUploadsAccess;
    acl?: 'private' | 'public-read';
    bucket: string;
    collections: GcsStorageOptions['collections'];
    getStorageClient: () => Storage;
}
export declare const getGenerateSignedURLHandler: ({ access, bucket, collections, getStorageClient, }: Args) => PayloadHandler;
export {};
//# sourceMappingURL=generateSignedURL.d.ts.map