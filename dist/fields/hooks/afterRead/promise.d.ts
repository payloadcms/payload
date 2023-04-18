import { Field, TabAsField } from '../../config/types';
import { PayloadRequest } from '../../../express/types';
type Args = {
    currentDepth: number;
    depth: number;
    doc: Record<string, unknown>;
    field: Field | TabAsField;
    fieldPromises: Promise<void>[];
    findMany: boolean;
    flattenLocales: boolean;
    populationPromises: Promise<void>[];
    req: PayloadRequest;
    overrideAccess: boolean;
    siblingDoc: Record<string, unknown>;
    showHiddenFields: boolean;
};
export declare const promise: ({ currentDepth, depth, doc, field, fieldPromises, findMany, flattenLocales, overrideAccess, populationPromises, req, siblingDoc, showHiddenFields, }: Args) => Promise<void>;
export {};
