import type { PayloadRequest, PopulateType, RichTextAdapter, RichTextField } from 'payload';
import type { AdapterArguments } from '../types.js';
export type Args = Parameters<RichTextAdapter<any[], AdapterArguments>['graphQLPopulationPromises']>[0];
type RecurseRichTextArgs = {
    children: unknown[];
    currentDepth: number;
    depth: number;
    draft: boolean;
    field: RichTextField<any[], any, any>;
    overrideAccess: boolean;
    populateArg?: PopulateType;
    populationPromises: Promise<void>[];
    req: PayloadRequest;
    showHiddenFields: boolean;
};
export declare const recurseRichText: ({ children, currentDepth, depth, draft, field, overrideAccess, populateArg, populationPromises, req, showHiddenFields, }: RecurseRichTextArgs) => void;
export declare const richTextRelationshipPromise: ({ currentDepth, depth, draft, field, overrideAccess, parentIsLocalized, populateArg, populationPromises, req, showHiddenFields, siblingDoc, }: Args) => void;
export {};
//# sourceMappingURL=richTextRelationshipPromise.d.ts.map