import type { HandleDelete } from '@payloadcms/plugin-cloud-storage/types';
type HandleDeleteArgs = {
    baseUrl: string;
    prefix?: string;
    token: string;
};
export declare const getHandleDelete: ({ baseUrl, token }: HandleDeleteArgs) => HandleDelete;
export {};
//# sourceMappingURL=handleDelete.d.ts.map