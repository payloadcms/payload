import type { ClientUploadsConfig, CollectionOptions } from '@payloadcms/plugin-cloud-storage/types';
import type { Plugin, UploadCollectionSlug } from 'payload';
import * as AWS from '@aws-sdk/client-s3';
import type { SignedDownloadsConfig } from './staticHandler.js';
export type S3StorageOptions = {
    /**
     * Access control list for uploaded files.
     */
    acl?: 'private' | 'public-read';
    /**
     * When enabled, fields (like the prefix field) will always be inserted into
     * the collection schema regardless of whether the plugin is enabled. This
     * ensures a consistent schema across all environments.
     *
     * This will be enabled by default in Payload v4.
     *
     * @default false
     */
    alwaysInsertFields?: boolean;
    /**
     * Bucket name to upload files to.
     *
     * Must follow [AWS S3 bucket naming conventions](https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucketnamingrules.html).
     */
    bucket: string;
    /**
     * Optional cache key to identify the S3 storage client instance.
     * If not provided, a default key will be used.
     *
     * @default `s3:containerName`
     */
    clientCacheKey?: string;
    /**
     * Do uploads directly on the client to bypass limits on Vercel. You must allow CORS PUT method for the bucket to your website.
     */
    clientUploads?: ClientUploadsConfig;
    /**
     * Collection options to apply the S3 adapter to.
     */
    collections: Partial<Record<UploadCollectionSlug, ({
        signedDownloads?: SignedDownloadsConfig;
    } & Omit<CollectionOptions, 'adapter'>) | true>>;
    /**
     * AWS S3 client configuration. Highly dependent on your AWS setup.
     *
     * [AWS.S3ClientConfig Docs](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/interfaces/s3clientconfig.html)
     */
    config: AWS.S3ClientConfig;
    /**
     * Whether or not to disable local storage
     *
     * @default true
     */
    disableLocalStorage?: boolean;
    /**
     * Whether or not to enable the plugin
     *
     * Default: true
     */
    enabled?: boolean;
    /**
     * Use pre-signed URLs for files downloading. Can be overriden per-collection.
     */
    signedDownloads?: SignedDownloadsConfig;
};
type S3StoragePlugin = (storageS3Args: S3StorageOptions) => Plugin;
export declare const s3Storage: S3StoragePlugin;
export {};
//# sourceMappingURL=index.d.ts.map