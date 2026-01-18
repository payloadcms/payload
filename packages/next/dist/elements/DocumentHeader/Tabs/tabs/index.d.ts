import type { DocumentTabConfig, SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload';
export declare const documentViewKeys: string[];
export type DocumentViewKey = (typeof documentViewKeys)[number];
export declare const getTabs: ({ collectionConfig, globalConfig, }: {
    collectionConfig?: SanitizedCollectionConfig;
    globalConfig?: SanitizedGlobalConfig;
}) => {
    tab: DocumentTabConfig;
    viewPath: string;
}[];
//# sourceMappingURL=index.d.ts.map