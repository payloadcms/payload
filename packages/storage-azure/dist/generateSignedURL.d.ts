import type { ContainerClient } from '@azure/storage-blob';
import type { ClientUploadsAccess } from '@payloadcms/plugin-cloud-storage/types';
import type { PayloadHandler } from 'payload';
import type { AzureStorageOptions } from './index.js';
interface Args {
    access?: ClientUploadsAccess;
    collections: AzureStorageOptions['collections'];
    containerName: string;
    getStorageClient: () => ContainerClient;
}
export declare const getGenerateSignedURLHandler: ({ access, collections, containerName, getStorageClient, }: Args) => PayloadHandler;
export {};
//# sourceMappingURL=generateSignedURL.d.ts.map