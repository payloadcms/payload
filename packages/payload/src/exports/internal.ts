/**
 * Modules exported here are not part of the public API and are subject to change without notice and without a major version bump.
 */

import type { UntypedGeneratedTypes } from '../index.js'

export { getEntityPermissions } from '../utilities/getEntityPermissions/getEntityPermissions.js'
export { sanitizePermissions } from '../utilities/sanitizePermissions.js'

/**
 * Returns `TType[TKey]` if it exists via infer pattern, otherwise falls back to `UntypedGeneratedTypes[TKey]`.
 *
 * The infer pattern extracts typed properties when they exist (from module augmentation or Config).
 * Falls back to UntypedGeneratedTypes when the property doesn't exist on TType.
 *
 * @see test "ResolveFallback pattern allows generic indexing" in test/types/types.spec.ts.
 * Read the comment in this test before modifying this type. We *have* to use `infer` here, not `extends keyof`.
 *
 * @internal - for internal use only
 */
export type ResolveFallback<TType, TKey extends keyof UntypedGeneratedTypes> =
  TType extends Record<TKey, infer TValue> ? TValue : UntypedGeneratedTypes[TKey]
