import { type Locale, type Payload, type PayloadRequest, type TypedUser, type TypeWithID } from 'payload';
type Args = {
    collectionSlug?: string;
    globalSlug?: string;
    id?: number | string;
    locale?: Locale;
    payload: Payload;
    req?: PayloadRequest;
    segments?: string[];
    user?: TypedUser;
};
export declare const getDocumentData: ({ id: idArg, collectionSlug, globalSlug, locale, payload, req, segments, user, }: Args) => Promise<null | Record<string, unknown> | TypeWithID>;
export {};
//# sourceMappingURL=getDocumentData.d.ts.map