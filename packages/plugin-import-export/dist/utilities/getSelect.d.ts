import type { SelectIncludeType } from 'payload';
/**
 * Takes an input of array of string paths in dot notation and returns a select object.
 * Used for both export and import to build Payload's select query format.
 *
 * @example
 * getSelect(['id', 'title', 'group.value', 'createdAt', 'updatedAt'])
 * // Returns: { id: true, title: true, group: { value: true }, createdAt: true, updatedAt: true }
 */
export declare const getSelect: (fields: string[]) => SelectIncludeType;
//# sourceMappingURL=getSelect.d.ts.map