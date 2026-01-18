import type { HandleUpload } from '@payloadcms/plugin-cloud-storage/types';
import type { UTApi } from 'uploadthing/server';
import type { ACL } from './index.js';
type HandleUploadArgs = {
    acl: ACL;
    utApi: UTApi;
};
export declare const getHandleUpload: ({ acl, utApi }: HandleUploadArgs) => HandleUpload;
export {};
//# sourceMappingURL=handleUpload.d.ts.map