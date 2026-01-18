import type { Data, Document, PayloadRequest, SanitizedCollectionConfig } from 'payload';
import type { GenerateLabel, GenerateURL } from '../types.js';
type Args = {
    breadcrumbsFieldName?: string;
    collection: SanitizedCollectionConfig;
    data: Data;
    generateLabel?: GenerateLabel;
    generateURL?: GenerateURL;
    originalDoc?: Document;
    parentFieldName?: string;
    req: PayloadRequest;
};
export declare const populateBreadcrumbs: ({ breadcrumbsFieldName, collection, data, generateLabel, generateURL, originalDoc, parentFieldName, req, }: Args) => Promise<Data>;
export {};
//# sourceMappingURL=populateBreadcrumbs.d.ts.map