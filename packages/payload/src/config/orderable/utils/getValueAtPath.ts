/**
 * Reads a nested value from an object using dot-notation path syntax.
 */
export function getValueAtPath(data: unknown, path: string): unknown {
  if (!data || typeof data !== 'object') {
    return undefined
  }

  const segments = path.split('.')
  let currentValue: unknown = data

  for (const segment of segments) {
    if (!currentValue || typeof currentValue !== 'object') {
      return undefined
    }

    currentValue = (currentValue as Record<string, unknown>)[segment]
  }

  return currentValue
}
