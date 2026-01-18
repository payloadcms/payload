import { type CollectionSlug, type PayloadRequest, type ServerFunction } from 'payload';
export type CopyDataFromLocaleArgs = {
    collectionSlug?: CollectionSlug;
    docID?: number | string;
    fromLocale: string;
    globalSlug?: string;
    overrideData?: boolean;
    req: PayloadRequest;
    toLocale: string;
};
export declare const copyDataFromLocaleHandler: ServerFunction<CopyDataFromLocaleArgs>;
export declare const copyDataFromLocale: (args: CopyDataFromLocaleArgs) => Promise<import("payload").JsonObject>;
//# sourceMappingURL=copyDataFromLocale.d.ts.map