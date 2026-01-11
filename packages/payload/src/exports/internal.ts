/**
 * Modules exported here are not part of the public API and are subject to change without notice and without a major version bump.
 */

export { getEntityPermissions } from '../utilities/getEntityPermissions/getEntityPermissions.js'
export { sanitizePermissions } from '../utilities/sanitizePermissions.js'

/**
 * Returns `TType[TDesiredKey]` if it exists, otherwise `TType[TFallbackKey]`.
 *
 * @see test "ResolveFallback pattern allows generic indexing" in test/types/types.spec.ts.
 * Read the comment in this test before modifying this type. We *have* to use `infer` here, not `extends keyof`.
 *
 * @internal - for internal use only
 */
export type ResolveFallback<TType, TDesiredKey extends string, TFallbackKey extends keyof TType> =
  TType extends Record<TDesiredKey, infer TValue> ? TValue : TType[TFallbackKey]
