import type { Document } from 'payload';
import type { ToCSVFunction } from '../types.js';
type Args = {
    doc: Document;
    fields?: string[];
    prefix?: string;
    toCSVFunctions: Record<string, ToCSVFunction>;
};
export declare const flattenObject: ({ doc, fields, prefix, toCSVFunctions, }: Args) => Record<string, unknown>;
export {};
//# sourceMappingURL=flattenObject.d.ts.map