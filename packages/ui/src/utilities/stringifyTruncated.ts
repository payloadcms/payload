/**
 * Stringify a value and truncate it to a maximum length.
 *
 * @param value - The value to stringify and truncate.
 * @param maxLength - The maximum length of the stringified value.
 * @returns The stringified and truncated value.
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
