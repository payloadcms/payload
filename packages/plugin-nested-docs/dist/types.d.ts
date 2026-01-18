import type { CollectionSlug, PayloadRequest, SanitizedCollectionConfig } from 'payload';
export type Breadcrumb = {
    doc: string;
    label: string;
    url?: string;
};
export type GenerateURL = (docs: Array<Record<string, unknown>>, currentDoc: Record<string, unknown>, collection: SanitizedCollectionConfig, req: PayloadRequest) => string;
export type GenerateLabel = (docs: Array<Record<string, unknown>>, currentDoc: Record<string, unknown>, collection: SanitizedCollectionConfig, req: PayloadRequest) => string;
export type NestedDocsPluginConfig = {
    /**
     * Should be supplied if using an alternative field name for the 'breadcrumbs' field in collections
     */
    breadcrumbsFieldSlug?: string;
    /**
     * The slugs of the collections this plugin should extend. If you need different configs for different collections, this plugin can be added to your config more than once having different collections.
     */
    collections: CollectionSlug[];
    generateLabel?: GenerateLabel;
    generateURL?: GenerateURL;
    /**
     * Should be supplied if using an alternative field name for the 'parent' field in collections
     */
    parentFieldSlug?: string;
};
//# sourceMappingURL=types.d.ts.map