import type { Storage } from '@google-cloud/storage';
import type { GenerateURL } from '@payloadcms/plugin-cloud-storage/types';
interface Args {
    bucket: string;
    getStorageClient: () => Storage;
}
export declare const getGenerateURL: ({ bucket, getStorageClient }: Args) => GenerateURL;
export {};
//# sourceMappingURL=generateURL.d.ts.map