/**
 * If there is an incoming row id,
 * and it matches the existing sibling doc id,
 * this is an existing row, so it should be merged.
 * Otherwise, return an empty object.
 */
import type { JsonObject } from '../../../types/index.js';
export declare const getExistingRowDoc: (incomingRow: JsonObject, existingRows?: unknown) => JsonObject;
//# sourceMappingURL=getExistingRowDoc.d.ts.map