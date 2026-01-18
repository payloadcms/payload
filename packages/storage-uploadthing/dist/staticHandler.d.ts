import type { StaticHandler } from '@payloadcms/plugin-cloud-storage/types';
import type { UTApi } from 'uploadthing/server';
type Args = {
    utApi: UTApi;
};
export declare const getHandler: ({ utApi }: Args) => StaticHandler;
export {};
//# sourceMappingURL=staticHandler.d.ts.map