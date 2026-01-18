import type { SerializedEditorState } from 'lexical';
import type { RichTextAdapter } from 'payload';
import type { PopulationPromise } from '../features/typesServer.js';
import type { AdapterProps } from '../types.js';
export type Args = {
    editorPopulationPromises: Map<string, Array<PopulationPromise>>;
    parentIsLocalized: boolean;
} & Parameters<NonNullable<RichTextAdapter<SerializedEditorState, AdapterProps>['graphQLPopulationPromises']>>[0];
/**
 * Appends all new populationPromises to the populationPromises prop
 */
export declare const populateLexicalPopulationPromises: ({ context, currentDepth, depth, draft, editorPopulationPromises, field, fieldPromises, findMany, flattenLocales, overrideAccess, parentIsLocalized, populationPromises, req, showHiddenFields, siblingDoc, }: Args) => void;
//# sourceMappingURL=populateLexicalPopulationPromises.d.ts.map