import type { PayloadRequest } from '../types/index.js';
type Args = {
    collectionSlug: string;
    desiredFilename: string;
    prefix?: string;
    req: PayloadRequest;
    staticPath: string;
};
export declare function getSafeFileName({ collectionSlug, desiredFilename, prefix, req, staticPath, }: Args): Promise<string>;
export {};
//# sourceMappingURL=getSafeFilename.d.ts.map