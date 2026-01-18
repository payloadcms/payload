import type { ContainerClient } from '@azure/storage-blob';
import type { HandleUpload } from '@payloadcms/plugin-cloud-storage/types';
import type { CollectionConfig } from 'payload';
interface Args {
    collection: CollectionConfig;
    getStorageClient: () => ContainerClient;
    prefix?: string;
}
export declare const getHandleUpload: ({ getStorageClient, prefix }: Args) => HandleUpload;
export {};
//# sourceMappingURL=handleUpload.d.ts.map