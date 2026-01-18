import type { Field, JsonObject, PayloadRequest, RequestContext } from 'payload';
import type { PopulationPromise } from '../features/typesServer.js';
type NestedRichTextFieldsArgs = {
    context: RequestContext;
    currentDepth?: number;
    data: unknown;
    depth: number;
    draft: boolean;
    /**
     * This maps all the population promises to the node types
     */
    editorPopulationPromises: Map<string, Array<PopulationPromise>>;
    /**
     * fieldPromises are used for things like field hooks. They should be awaited before awaiting populationPromises
     */
    fieldPromises: Promise<void>[];
    fields: Field[];
    findMany: boolean;
    flattenLocales: boolean;
    overrideAccess: boolean;
    parentIsLocalized: boolean;
    populationPromises: Promise<void>[];
    req: PayloadRequest;
    showHiddenFields: boolean;
    siblingDoc: JsonObject;
};
export declare const recursivelyPopulateFieldsForGraphQL: ({ context, currentDepth, data, depth, draft, fieldPromises, fields, findMany, flattenLocales, overrideAccess, parentIsLocalized, populationPromises, req, showHiddenFields, siblingDoc, }: NestedRichTextFieldsArgs) => void;
export {};
//# sourceMappingURL=recursivelyPopulateFieldsForGraphQL.d.ts.map