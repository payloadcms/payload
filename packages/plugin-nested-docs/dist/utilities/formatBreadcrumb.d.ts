import type { PayloadRequest, SanitizedCollectionConfig } from 'payload';
import type { Breadcrumb, GenerateLabel, GenerateURL } from '../types.js';
type Args = {
    /**
     * Existing breadcrumb, if any, to base the new breadcrumb on.
     * This ensures that row IDs are maintained across updates, etc.
     */
    breadcrumb?: Breadcrumb;
    collection: SanitizedCollectionConfig;
    docs: Record<string, unknown>[];
    generateLabel?: GenerateLabel;
    generateURL?: GenerateURL;
    req: PayloadRequest;
};
export declare const formatBreadcrumb: ({ breadcrumb, collection, docs, generateLabel, generateURL, req, }: Args) => Breadcrumb;
export {};
//# sourceMappingURL=formatBreadcrumb.d.ts.map