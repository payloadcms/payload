import type { PayloadRequest, SanitizedCollectionConfig, SanitizedGlobalConfig, TypedUser } from 'payload';
type Args = {
    collectionConfig?: SanitizedCollectionConfig;
    globalConfig?: SanitizedGlobalConfig;
    id?: number | string;
    isEditing: boolean;
    req: PayloadRequest;
};
type Result = Promise<{
    currentEditor?: TypedUser;
    isLocked: boolean;
    lastUpdateTime?: number;
}>;
export declare const getIsLocked: ({ id, collectionConfig, globalConfig, isEditing, req, }: Args) => Result;
export {};
//# sourceMappingURL=getIsLocked.d.ts.map