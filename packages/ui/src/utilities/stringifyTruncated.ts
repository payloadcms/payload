/**
 * Safely stringify a value and truncate it to a maximum length.
 *
 * Converts any value to a JSON string representation and truncates the resulting
 * string if it exceeds the maximum length. If truncation occurs, an ellipsis (…)
 * is appended to indicate incomplete output.
 *
 * @param value - The value to stringify (can be any type including objects, arrays, primitives)
 * @param maxLength - The maximum character length of the output string
 * @returns A JSON string representation, truncated with "…" if it exceeds maxLength
 */
export function stringifyTruncated(value: unknown, maxLength: number): string {
  const stringifiedJSON = JSON.stringify(value)
  const totalChars = stringifiedJSON.length

  // Only truncate if the string is significantly longer (>1.5x the max length)
  if (totalChars / maxLength > 1.5) {
    return `${stringifiedJSON.substring(0, maxLength)}\u2026`
  }

  return stringifiedJSON
}
