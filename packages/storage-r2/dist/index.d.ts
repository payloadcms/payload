import type { CollectionOptions } from '@payloadcms/plugin-cloud-storage/types';
import type { Plugin, UploadCollectionSlug } from 'payload';
import type { R2Bucket } from './types.js';
export interface R2StorageOptions {
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
    bucket: R2Bucket;
    /**
     * Collection options to apply the R2 adapter to.
     */
    collections: Partial<Record<UploadCollectionSlug, Omit<CollectionOptions, 'adapter'> | true>>;
    enabled?: boolean;
}
type R2StoragePlugin = (r2StorageArgs: R2StorageOptions) => Plugin;
export declare const r2Storage: R2StoragePlugin;
export {};
//# sourceMappingURL=index.d.ts.map