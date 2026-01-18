import type { PayloadRequest, SelectType } from 'payload';
type PopulateArguments = {
    collectionSlug: string;
    currentDepth?: number;
    data: unknown;
    depth: number;
    draft: boolean;
    id: number | string;
    key: number | string;
    overrideAccess: boolean;
    req: PayloadRequest;
    select?: SelectType;
    showHiddenFields: boolean;
};
type PopulateFn = (args: PopulateArguments) => Promise<void>;
export declare const populate: PopulateFn;
export {};
//# sourceMappingURL=populate.d.ts.map