import type { Field, PayloadRequest, ResolvedFilterOptions } from 'payload';
export declare const resolveAllFilterOptions: ({ fields, pathPrefix, req, result, }: {
    fields: Field[];
    pathPrefix?: string;
    req: PayloadRequest;
    result?: Map<string, ResolvedFilterOptions>;
}) => Promise<Map<string, ResolvedFilterOptions>>;
//# sourceMappingURL=resolveAllFilterOptions.d.ts.map