/**
  * If there is an incoming row id,
  * and it matches the existing sibling doc id,
  * this is an existing row, so it should be merged.
  * Otherwise, return an empty object.
 */
export declare const getExistingRowDoc: (incomingRow: Record<string, unknown>, existingRows?: unknown) => Record<string, unknown>;
