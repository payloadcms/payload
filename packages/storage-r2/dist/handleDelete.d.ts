import type { HandleDelete } from '@payloadcms/plugin-cloud-storage/types';
import type { R2Bucket } from './types.js';
interface Args {
    bucket: R2Bucket;
}
export declare const getHandleDelete: ({ bucket }: Args) => HandleDelete;
export {};
//# sourceMappingURL=handleDelete.d.ts.map