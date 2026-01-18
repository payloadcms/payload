import type { HandleUpload } from '@payloadcms/plugin-cloud-storage/types';
import type { VercelBlobStorageOptions } from './index.js';
type HandleUploadArgs = {
    baseUrl: string;
    prefix?: string;
} & Omit<VercelBlobStorageOptions, 'collections'>;
export declare const getHandleUpload: ({ access, addRandomSuffix, baseUrl, cacheControlMaxAge, prefix, token, }: HandleUploadArgs) => HandleUpload;
export {};
//# sourceMappingURL=handleUpload.d.ts.map