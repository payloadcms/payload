import type { PayloadRequest } from '../types/index.js';
type CheckDocumentLockStatusArgs = {
    collectionSlug?: string;
    globalSlug?: string;
    id?: number | string;
    lockDurationDefault?: number;
    lockErrorMessage?: string;
    overrideLock?: boolean;
    req: PayloadRequest;
};
export declare const checkDocumentLockStatus: ({ id, collectionSlug, globalSlug, lockDurationDefault, lockErrorMessage, overrideLock, req, }: CheckDocumentLockStatusArgs) => Promise<void>;
export {};
//# sourceMappingURL=checkDocumentLockStatus.d.ts.map