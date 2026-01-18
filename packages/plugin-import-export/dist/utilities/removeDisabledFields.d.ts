/**
 * Recursively removes fields from a deeply nested object based on dot-notation paths.
 *
 * This utility supports removing:
 * - Nested fields in plain objects (e.g., "group.value")
 * - Fields inside arrays of objects (e.g., "group.array.field1")
 *
 * It safely traverses both object and array structures and avoids mutating the original input.
 *
 * @param obj - The original object to clean.
 * @param disabled - An array of dot-separated paths indicating which fields to remove.
 * @returns A deep clone of the original object with specified fields removed.
 */
export declare const removeDisabledFields: (obj: Record<string, unknown>, disabled?: string[]) => Record<string, unknown>;
//# sourceMappingURL=removeDisabledFields.d.ts.map