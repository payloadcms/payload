import type { Field, PayloadRequest, PopulateType } from 'payload';
type NestedRichTextFieldsArgs = {
    currentDepth?: number;
    data: unknown;
    depth: number;
    draft: boolean;
    fields: Field[];
    overrideAccess: boolean;
    populateArg?: PopulateType;
    populationPromises: Promise<void>[];
    req: PayloadRequest;
    showHiddenFields: boolean;
};
export declare const recurseNestedFields: ({ currentDepth, data, depth, draft, fields, overrideAccess, populateArg, populationPromises, req, showHiddenFields, }: NestedRichTextFieldsArgs) => void;
export {};
//# sourceMappingURL=recurseNestedFields.d.ts.map