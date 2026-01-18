/**
 * Sets a value deeply into a nested object or array, based on a dot-notation path.
 *
 * This function:
 * - Supports array indexing (e.g., "array.0.field1")
 * - Creates intermediate arrays/objects as needed
 * - Mutates the target object directly
 *
 * @example
 * const obj = {}
 * setNestedValue(obj, 'group.array.0.field1', 'hello')
 * // Result: { group: { array: [ { field1: 'hello' } ] } }
 *
 * @param obj - The target object to mutate.
 * @param path - A dot-separated string path indicating where to assign the value.
 * @param value - The value to set at the specified path.
 */
export declare const setNestedValue: (obj: Record<string, unknown>, path: string, value: unknown) => void;
//# sourceMappingURL=setNestedValue.d.ts.map