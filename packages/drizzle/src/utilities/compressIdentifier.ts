/**
 * Compresses a SQL identifier (index, FK, constraint name) to fit within the
 * database's max identifier length while keeping names readable and deterministic.
 *
 * Algorithm:
 * 1. If `segments.join('_') + suffix` fits within `maxLength`, return as-is.
 * 2. Otherwise, progressively compress segments (longest first, excluding the
 *    last segment initially) by removing interior vowels and collapsing double
 *    consonants. A 4-char hash of the original full name is always appended
 *    for uniqueness.
 * 3. If still too long, compress the last segment too.
 * 4. If still too long, truncate the prefix, then the tail if needed.
 *
 * Output format when compression is needed:
 *   `[compressed_segments]_[hash][suffix]`
 *
 * @param segments - Name parts to join with underscores
 * @param suffix - Identifier type suffix, e.g. `_idx`, `_fk`, `_unique`
 * @param maxLength - Database identifier length limit (e.g. 63 for PostgreSQL)
 * @returns The compressed identifier string
 */
export const compressIdentifier = ({
  maxLength,
  segments: _segments,
  suffix,
}: {
  maxLength: number
  segments: string[]
  suffix: string
}): string => {
  const segments = [..._segments]
  const fullName = `${segments.join('_')}${suffix}`
  if (fullName.length <= maxLength) {
    // should not collide since it's the original name
    return fullName
  }

  const hash = hashString(fullName)
  const hashSuffix = `_${hash}${suffix}`

  const compressed = [...segments]
  let excess = fullName.length + hashSuffix.length - suffix.length - maxLength

  // prefix = 0 - n-1 segments, tail = last segment
  const prefixIndices = segments.length > 1 ? segments.slice(0, -1).map((_, i) => i) : []
  prefixIndices.sort((a, b) => segments[b].length - segments[a].length)

  for (const i of prefixIndices) {
    if (excess <= 0) {
      break
    }
    if (compressed[i].length <= 3) {
      continue
    }
    const orig = compressed[i]
    compressed[i] = compressSegment(orig)
    excess -= orig.length - compressed[i].length
  }

  if (excess > 0) {
    // only compress the tail if prefix compression wasn't enough
    const tailIdx = segments.length - 1
    if (compressed[tailIdx].length > 3) {
      const orig = compressed[tailIdx]
      compressed[tailIdx] = compressSegment(orig)
      excess -= orig.length - compressed[tailIdx].length
    }
  }

  let body = compressed.join('_')
  let candidate = `${body}${hashSuffix}`

  if (candidate.length > maxLength) {
    // if compression isn't enough, truncate the body to fit within the limit with the hash
    const budget = maxLength - hashSuffix.length
    if (budget <= 0) {
      throw new Error(
        `Unable to generate identifier for "${fullName}" within maxLength ${maxLength}.`,
      )
    }
    body = body.slice(0, budget).replace(/_+$/, '')
    candidate = `${body}${hashSuffix}`
  }

  return candidate
}

/**
 * Compresses a single segment by removing interior vowels and collapsing
 * repeated consonants. Handles underscore-separated sub-parts independently.
 *
 * Examples:
 * - `"ingredients"` -> `"ingrdnts"` (interior vowels removed)
 * - `"settings"` -> `"stngs"` (vowels removed, `tt` collapsed to `t`)
 * - `"parent_id"` -> `"prnt_id"` (each sub-part compressed separately)
 */
function compressSegment(str: string): string {
  if (str.length <= 3) {
    return str
  }

  const compressed = str.split('_').map((part) => {
    if (part.length <= 2) {
      return part
    }
    const first = part[0]
    const last = part[part.length - 1]
    const interior = part
      .slice(1, -1)
      .replace(/[aeiou]/gi, '')
      .replace(/([a-z])\1+/gi, '$1')
    return `${first}${interior}${last}`
  })
  return compressed.join('_')
}

/**
 * Produces a deterministic 4-character hex hash (FNV-1a inspired) of the input string.
 */
function hashString(str: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = (hash * 0x01000193) >>> 0
  }
  return (hash >>> 0).toString(16).slice(0, 4)
}
