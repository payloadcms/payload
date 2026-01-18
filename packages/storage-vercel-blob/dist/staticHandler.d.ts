import type { StaticHandler } from '@payloadcms/plugin-cloud-storage/types';
import type { CollectionConfig } from 'payload';
type StaticHandlerArgs = {
    baseUrl: string;
    cacheControlMaxAge?: number;
    token: string;
};
export declare const getStaticHandler: ({ baseUrl, cacheControlMaxAge, token }: StaticHandlerArgs, collection: CollectionConfig) => StaticHandler;
export {};
//# sourceMappingURL=staticHandler.d.ts.map