import type * as AWS from '@aws-sdk/client-s3';
import type { HandleDelete } from '@payloadcms/plugin-cloud-storage/types';
interface Args {
    bucket: string;
    getStorageClient: () => AWS.S3;
}
export declare const getHandleDelete: ({ bucket, getStorageClient }: Args) => HandleDelete;
export {};
//# sourceMappingURL=handleDelete.d.ts.map