/**
 * Returned by `sanitizeQueryValue` when a scalar operand cannot be cast to its column's type -
 * a non-uuid against a `uuid` column, a non-numeric string against a numeric one.
 *
 * Such an operand used to be coerced to `null`, which `parseParams` then compiles to
 * `IS NULL` / `IS NOT NULL` for `equals` / `not_equals`. That silently answers a different
 * question: on a nullable column, `equals: 'not-a-uuid'` returned every document whose value
 * was empty. This symbol keeps "the caller asked for null" and "this value can never match"
 * apart, so only the former still reaches the null checks.
 */
export const UnmatchableValue = Symbol('UnmatchableValue')
