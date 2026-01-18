import type { DocumentPreferences, Payload, TypedUser } from 'payload';
type Args = {
    collectionSlug?: string;
    globalSlug?: string;
    id?: number | string;
    payload: Payload;
    user: TypedUser;
};
export declare const getDocPreferences: ({ id, collectionSlug, globalSlug, payload, user, }: Args) => Promise<DocumentPreferences>;
export {};
//# sourceMappingURL=getDocPreferences.d.ts.map