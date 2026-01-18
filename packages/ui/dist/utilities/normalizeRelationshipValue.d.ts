/**
 * Normalizes relationship/upload field values by extracting IDs from nested objects
 * and returning them in the appropriate format based on whether the field is polymorphic.
 *
 * @param value - The value to normalize (can be a simple ID, or an object with relationTo and value)
 * @param relationTo - The relationTo config (string for monomorphic, array for polymorphic)
 * @returns The normalized value (simple ID for monomorphic, {relationTo, value} for polymorphic)
 *
 * @example
 * // Monomorphic field - returns simple ID
 * normalizeRelationshipValue('123', 'users') // '123'
 * normalizeRelationshipValue({ relationTo: 'users', value: '123' }, 'users') // '123'
 *
 * @example
 * // Polymorphic field - returns {relationTo, value}
 * normalizeRelationshipValue('123', ['users', 'posts']) // '123' (kept as-is, no relationTo to infer)
 * normalizeRelationshipValue({ relationTo: 'users', value: '123' }, ['users', 'posts'])
 * // { relationTo: 'users', value: '123' }
 *
 * @example
 * // Handles nested value objects (populated documents)
 * normalizeRelationshipValue(
 *   { relationTo: 'users', value: { id: '123', name: 'John' } },
 *   ['users', 'posts']
 * )
 * // { relationTo: 'users', value: '123' }
 */
export declare function normalizeRelationshipValue(value: any, relationTo: string | string[]): any;
//# sourceMappingURL=normalizeRelationshipValue.d.ts.map