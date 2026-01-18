import type { PayloadHandler, PayloadRequest, UploadCollectionSlug } from 'payload';
type Args = {
    access?: (args: {
        collectionSlug: UploadCollectionSlug;
        req: PayloadRequest;
    }) => boolean | Promise<boolean>;
    addRandomSuffix?: boolean;
    cacheControlMaxAge?: number;
    token: string;
};
export declare const getClientUploadRoute: ({ access, addRandomSuffix, cacheControlMaxAge, token }: Args) => PayloadHandler;
export {};
//# sourceMappingURL=getClientUploadRoute.d.ts.map