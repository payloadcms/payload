import type * as AWS from '@aws-sdk/client-s3';
import type { StaticHandler } from '@payloadcms/plugin-cloud-storage/types';
import type { CollectionConfig, PayloadRequest } from 'payload';
export type SignedDownloadsConfig = {
    /** @default 7200 */
    expiresIn?: number;
    shouldUseSignedURL?(args: {
        collection: CollectionConfig;
        filename: string;
        req: PayloadRequest;
    }): boolean | Promise<boolean>;
} | boolean;
interface Args {
    bucket: string;
    collection: CollectionConfig;
    getStorageClient: () => AWS.S3;
    signedDownloads?: SignedDownloadsConfig;
}
export declare const getHandler: ({ bucket, collection, getStorageClient, signedDownloads, }: Args) => StaticHandler;
export {};
//# sourceMappingURL=staticHandler.d.ts.map