/**
 * Whether one MIME type can match both patterns. Patterns use the forms that `matchesMimeType`
 * accepts: an exact type (`image/png`), a category wildcard (`image/*`), or the universal
 * wildcard (`*` + `/*`). Startup validation rejects other forms.
 */
export function mimePatternsOverlap({ a, b }: { a: string; b: string }): boolean {
  const left = a.trim().toLowerCase()
  const right = b.trim().toLowerCase()

  if (left === '*/*' || right === '*/*') {
    return true
  }

  const [leftType, leftSubtype] = left.split('/')
  const [rightType, rightSubtype] = right.split('/')

  if (leftType !== rightType) {
    return false
  }

  return leftSubtype === '*' || rightSubtype === '*' || leftSubtype === rightSubtype
}
