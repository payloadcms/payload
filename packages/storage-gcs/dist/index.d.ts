import type { StorageOptions } from '@google-cloud/storage';
import type { ClientUploadsConfig, CollectionOptions } from '@payloadcms/plugin-cloud-storage/types';
import type { Plugin, UploadCollectionSlug } from 'payload';
export interface GcsStorageOptions {
    acl?: 'Private' | 'Public';
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
     * The name of the bucket to use.
     */
    bucket: string;
    /**
     * Optional cache key to identify the GCS storage client instance.
     * If not provided, a default key will be used.
     *
     * @default `gcs:containerName`
     */
    clientCacheKey?: string;
    /**
     * Do uploads directly on the client to bypass limits on Vercel. You must allow CORS PUT method for the bucket to your website.
     */
    clientUploads?: ClientUploadsConfig;
    /**
     * Collection options to apply the S3 adapter to.
     */
    collections: Partial<Record<UploadCollectionSlug, Omit<CollectionOptions, 'adapter'> | true>>;
    /**
     * Whether or not to enable the plugin
     *
     * Default: true
     */
    enabled?: boolean;
    /**
     * Google Cloud Storage client configuration.
     *
     * @see https://github.com/googleapis/nodejs-storage
     */
    options: StorageOptions;
}
type GcsStoragePlugin = (gcsStorageArgs: GcsStorageOptions) => Plugin;
export declare const gcsStorage: GcsStoragePlugin;
export {};
//# sourceMappingURL=index.d.ts.map