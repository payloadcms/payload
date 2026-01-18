import type { ContainerClient } from '@azure/storage-blob';
import type { HandleDelete } from '@payloadcms/plugin-cloud-storage/types';
import type { CollectionConfig } from 'payload';
interface Args {
    collection: CollectionConfig;
    getStorageClient: () => ContainerClient;
}
export declare const getHandleDelete: ({ getStorageClient }: Args) => HandleDelete;
export {};
//# sourceMappingURL=handleDelete.d.ts.map