// Get a nested value from an object by a dot/bracket/array path.
// Supports:
//   - Dot notation: 'a.b.c'
//   - Bracket notation: 'a[0].b', 'a["key.with.dots"]'
//   - Array form: ['a', 'b', 0, 'c']
// Returns `defaultValue` if the path cannot be fully resolved or the resolved value is `undefined`.
// Example: getPath(obj, 'a[0].b.c', 'fallback') → obj?.a?.[0]?.b?.c ?? 'fallback'

export function getPath(
  obj: any,
  path: Array<number | string | symbol> | string,
  defaultValue?: any,
): any {
  if (obj == null) {return defaultValue}

  const tokens = Array.isArray(path) ? path : toPath(path)

  let result = obj

  for (const key of tokens) {
    if (result == null) {return defaultValue}
    result = result[key]
  }

  return result === undefined ? defaultValue : result
}

function toPath(path: Array<number | string | symbol> | string): Array<number | string | symbol> {
  if (Array.isArray(path)) {return path}

  const tokens: Array<number | string> = []
  const regex = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])(.*?)\2)\]/g

  path.replace(regex, (plain, number, _quote, quotedKey) => {
    if (number !== undefined) {
      tokens.push(Number(number))
    } else if (quotedKey !== undefined) {
      tokens.push(quotedKey)
    } else {
      tokens.push(plain)
    }
    return ''
  })

  return tokens
}
