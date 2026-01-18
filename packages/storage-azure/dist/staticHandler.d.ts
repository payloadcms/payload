import type { ContainerClient } from '@azure/storage-blob';
import type { StaticHandler } from '@payloadcms/plugin-cloud-storage/types';
import type { CollectionConfig } from 'payload';
interface Args {
    collection: CollectionConfig;
    getStorageClient: () => ContainerClient;
}
export declare const getHandler: ({ collection, getStorageClient }: Args) => StaticHandler;
export {};
//# sourceMappingURL=staticHandler.d.ts.map