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
 */export function normalizeRelationshipValue(value, relationTo) {
  const isPoly = Array.isArray(relationTo);
  // If it's already a simple ID (string or number), return as-is for non-poly or wrap for poly
  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }
  // If it's an object with relationTo and value
  if (value && typeof value === 'object' && 'relationTo' in value && 'value' in value) {
    // Extract the actual ID value, handling nested objects
    let idValue = value.value;
    while (idValue && typeof idValue === 'object' && idValue !== null && 'value' in idValue) {
      idValue = idValue.value;
    }
    // If the nested value is a populated document with an ID, extract it
    if (idValue && typeof idValue === 'object' && idValue !== null && 'id' in idValue) {
      idValue = idValue.id;
    }
    // Return the normalized structure
    if (isPoly) {
      return {
        relationTo: value.relationTo,
        value: idValue
      };
    }
    return idValue;
  }
  // If it's a populated document object (has id but no relationTo/value structure)
  if (value && typeof value === 'object' && 'id' in value) {
    return value.id;
  }
  return value;
}
//# sourceMappingURL=normalizeRelationshipValue.js.map