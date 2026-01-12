/**
 * Safely stringify a value and truncate it to a maximum length.
 *
 * Converts any value to a JSON string representation with efficient early termination
 * when the maximum length is reached. Handles circular references by replacing them
 * with `"[Circular]"` to prevent infinite loops.
 *
 * The function walks the object tree depth-first, building the JSON string incrementally
 * and stopping as soon as the maximum length is reached, avoiding unnecessary computation.
 * If truncation occurs, an ellipsis (…) is appended to indicate incomplete output.
 *
 * @param value - The value to stringify (can be any type including objects, arrays, primitives)
 * @param maxLength - The maximum character length of the output string
 * @returns A JSON string representation, truncated with "…" if it exceeds maxLength
 */
export function stringifyTruncated(value: unknown, maxLength: number): string {
  let result = ''
  const seen = new WeakSet()

  function walk(val: unknown): boolean {
    if (result.length >= maxLength) {
      return false
    }

    if (val === null || typeof val !== 'object') {
      result += JSON.stringify(val)
      return result.length < maxLength
    }

    if (seen.has(val)) {
      result += '"[Circular]"'
      return result.length < maxLength
    }
    seen.add(val)

    if (Array.isArray(val)) {
      result += '['
      for (let i = 0; i < val.length; i++) {
        if (i > 0) {
          result += ','
        }
        if (!walk(val[i])) {
          break
        }
      }
      result += ']'
    } else {
      result += '{'
      const entries = Object.entries(val)
      for (let i = 0; i < entries.length; i++) {
        if (i > 0) {
          result += ','
        }
        const [k, v] = entries[i]
        result += JSON.stringify(k) + ':'
        if (!walk(v)) {
          break
        }
      }
      result += '}'
    }

    return result.length < maxLength
  }

  walk(value)
  return result.length >= maxLength ? result.slice(0, maxLength) + '…' : result
}
