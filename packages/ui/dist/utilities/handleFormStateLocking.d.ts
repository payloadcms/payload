import type { PayloadRequest, TypedUser } from 'payload';
type Args = {
    collectionSlug?: string;
    globalSlug?: string;
    id?: number | string;
    req: PayloadRequest;
    updateLastEdited?: boolean;
};
type Result = {
    isLocked: boolean;
    lastEditedAt: string;
    user: TypedUser;
};
export declare const handleFormStateLocking: ({ id, collectionSlug, globalSlug, req, updateLastEdited, }: Args) => Promise<Result>;
export {};
//# sourceMappingURL=handleFormStateLocking.d.ts.map