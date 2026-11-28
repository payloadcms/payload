const MULTI_VALUE_OPERATORS = new Set(['in', 'not_in'])

export function isMultiValueOperator(operator: string | undefined): boolean {
  return Boolean(operator && MULTI_VALUE_OPERATORS.has(operator))
}

// single-value ops can still hold an array after switching off in/not_in
export function resolveSelectFilterValue(
  operator: string | undefined,
  value: unknown,
): unknown {
  if (!isMultiValueOperator(operator) && Array.isArray(value)) {
    return value[0]
  }
  return value
}

// only write once for a given scalar so a sticky array doesn't loop
export function shouldWriteSelectScalar(
  operator: string | undefined,
  value: unknown,
  lastWritten: unknown,
): { write: false } | { write: true; next: unknown } {
  if (!isMultiValueOperator(operator) && Array.isArray(value)) {
    const next = value[0]
    if (Object.is(lastWritten, next)) {
      return { write: false }
    }
    return { write: true, next }
  }
  return { write: false }
}
