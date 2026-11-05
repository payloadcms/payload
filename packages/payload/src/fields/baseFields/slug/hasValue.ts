/** A slug counts as set only when non-empty; `null`/`undefined`/`''` all mean "no slug yet". */
export const hasValue = (value: unknown): boolean =>
  value !== undefined && value !== null && value !== ''
