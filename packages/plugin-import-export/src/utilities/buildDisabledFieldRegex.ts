/**
 * Builds a RegExp that matches flattened field keys from a given dot-notated path.
 */
export const buildDisabledFieldRegex = (path: string): RegExp => {
  const parts = path.split('.')

  const patternParts = parts.map((part) => {
    return `${part}(?:_\\d+)?(?:_[^_]+)?`
  })

  const pattern = `^${patternParts.join('_')}(?:_.*)?$`
  return new RegExp(pattern)
}
