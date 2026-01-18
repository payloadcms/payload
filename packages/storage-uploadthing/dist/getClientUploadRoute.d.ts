import { type PayloadHandler, type PayloadRequest, type UploadCollectionSlug } from 'payload';
type Args = {
    access?: (args: {
        collectionSlug: UploadCollectionSlug;
        req: PayloadRequest;
    }) => boolean | Promise<boolean>;
    acl: 'private' | 'public-read';
    routerInputConfig?: FileRouterInputConfig;
    token?: string;
};
import type { FileRouterInputConfig } from './index.js';
export declare const getClientUploadRoute: ({ access, acl, routerInputConfig, token, }: Args) => PayloadHandler;
export {};
//# sourceMappingURL=getClientUploadRoute.d.ts.map