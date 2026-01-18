import type { PayloadRequest } from '../types/index.js';
type Args = {
    collectionSlug: string;
    filename: string;
    path: string;
    prefix?: string;
    req: PayloadRequest;
};
export declare const docWithFilenameExists: ({ collectionSlug, filename, prefix, req, }: Args) => Promise<boolean>;
export {};
//# sourceMappingURL=docWithFilenameExists.d.ts.map