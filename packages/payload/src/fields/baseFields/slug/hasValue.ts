/**
 * A slug value counts as present only when it is a non-empty value. `null`, `undefined`, and the
 * empty string all mean "no slug yet" — the trigger for source generation or the id fallback.
 */
export const hasValue = (value: unknown): boolean =>
  value !== undefined && value !== null && value !== ''
