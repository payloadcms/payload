/**
 * Safely retrieves a deeply nested value from an object using a dot-notation path.
 *
 * Supports:
 * - Indexed array access (e.g., "array.0.field1")
 * - Polymorphic blocks or keyed unions (e.g., "blocks.0.hero.title"), where the block key
 *   (e.g., "hero") maps to a nested object inside the block item.
 *
 *
 * @param obj - The input object to traverse.
 * @param path - A dot-separated string representing the path to retrieve.
 * @returns The value at the specified path, or undefined if not found.
 */
export declare const getValueAtPath: (obj: unknown, path: string) => unknown;
//# sourceMappingURL=getvalueAtPath.d.ts.map