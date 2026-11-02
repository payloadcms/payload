function normalize(value: string): string {
  return value.trim().toLowerCase()
}

/**
 * Matches an authoritative MIME type against a transformer-declared MIME pattern:
 * an exact value, a category wildcard (`image/*`), or the universal wildcard (matching
 * every type and subtype). Defensive by design — malformed input returns `false`
 * rather than throwing; startup validation owns rejecting malformed configured patterns.
 */
export function matchesMimeType({
  mimeType,
  pattern,
}: {
  mimeType: string
  pattern: string
}): boolean {
  if (typeof pattern !== 'string' || typeof mimeType !== 'string') {
    return false
  }

  const normalizedPattern = normalize(pattern)
  const normalizedMimeType = normalize(mimeType)

  if (normalizedPattern === '*/*') {
    return true
  }

  const patternParts = normalizedPattern.split('/')

  if (patternParts.length !== 2 || patternParts.some((part) => part.length === 0)) {
    return false
  }

  const [patternType, patternSubtype] = patternParts

  // "*/*" is the only valid full wildcard — a wildcard type with a concrete
  // subtype (e.g. "*/png") is invalid.
  if (patternType === '*') {
    return false
  }

  const mimeParts = normalizedMimeType.split('/')

  if (mimeParts.length !== 2) {
    return false
  }

  const [mimeTypeSegment, mimeSubtypeSegment] = mimeParts

  if (patternType !== mimeTypeSegment) {
    return false
  }

  return patternSubtype === '*' || patternSubtype === mimeSubtypeSegment
}
