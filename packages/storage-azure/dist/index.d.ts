import type { ClientUploadsConfig, CollectionOptions } from '@payloadcms/plugin-cloud-storage/types';
import type { Plugin, UploadCollectionSlug } from 'payload';
import { getStorageClient as getStorageClientFunc } from './utils/getStorageClient.js';
export type AzureStorageOptions = {
    /**
     * Whether or not to allow the container to be created if it does not exist
     *
     * @default false
     */
    allowContainerCreate: boolean;
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
     * Base URL for the Azure Blob storage account
     */
    baseURL: string;
    /**
     * Optional cache key to identify the Azure Blob storage client instance.
     * If not provided, a default key will be used.
     *
     * @default `azure:containerName`
     */
    clientCacheKey?: string;
    /**
     * Do uploads directly on the client to bypass limits on Vercel. You must allow CORS PUT method to your website.
     */
    clientUploads?: ClientUploadsConfig;
    /**
     * Collection options to apply the Azure Blob adapter to.
     */
    collections: Partial<Record<UploadCollectionSlug, Omit<CollectionOptions, 'adapter'> | true>>;
    /**
     * Azure Blob storage connection string
     */
    connectionString: string;
    /**
     * Azure Blob storage container name
     */
    containerName: string;
    /**
     * Whether or not to enable the plugin
     *
     * Default: true
     */
    enabled?: boolean;
};
type AzureStoragePlugin = (azureStorageArgs: AzureStorageOptions) => Plugin;
export declare const azureStorage: AzureStoragePlugin;
export { getStorageClientFunc as getStorageClient };
//# sourceMappingURL=index.d.ts.map