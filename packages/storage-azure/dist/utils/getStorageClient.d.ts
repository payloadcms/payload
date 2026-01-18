import type { ContainerClient } from '@azure/storage-blob';
import type { AzureStorageOptions } from '../index.js';
export declare function getStorageClient(options: Pick<AzureStorageOptions, 'clientCacheKey' | 'connectionString' | 'containerName'>): ContainerClient;
//# sourceMappingURL=getStorageClient.d.ts.map