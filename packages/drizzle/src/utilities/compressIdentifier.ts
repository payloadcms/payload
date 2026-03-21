/**
 * Compresses a SQL identifier (index, FK, constraint name) to fit within the
 * database's max identifier length while keeping names readable and deterministic.
 *
 * Algorithm:
 * 1. If `segments.join('_') + suffix` fits within `maxLength`, return as-is.
 * 2. Otherwise, progressively compress segments (longest first) by removing
 *    interior vowels and collapsing double consonants. A 4-char hash of the
 *    original full name is always appended for uniqueness.
 * 3. If compression alone isn't enough, the prefix is truncated to fit.
 * 4. Throws if the result still exceeds `maxLength` or collides with an
 *    existing entry in `trackingSet`.
 *
 * Output format when compression is needed:
 *   `[compressed_prefix]_[last_segment]_[hash][suffix]`
 *
 * @param segments - Name parts to join with underscores (last segment is preserved intact)
 * @param suffix - Identifier type suffix, e.g. `_idx`, `_fk`, `_unique`
 * @param maxLength - Database identifier length limit (e.g. 63 for PostgreSQL)
 * @param trackingSet - Set of already-used identifiers for collision detection
 * @returns The compressed identifier string
 */
export const compressIdentifier = ({
  maxLength,
  segments: _segments,
  suffix,
  trackingSet,
}: {
  maxLength: number
  segments: string[]
  suffix: string
  trackingSet: Set<string>
}): string => {
  const segments = [..._segments]
  const fullName = `${segments.join('_')}${suffix}`
  if (fullName.length <= maxLength) {
    // There should be no collisions if it fits as-is
    return fullName
  }
  const tail = segments[segments.length - 1]
  const hash = hashString(fullName)
  // Budget includes _hash (5 chars: underscore + 4 hex)
  const hashPart = `_${hash}`
  const fixedSuffix = `_${tail}${hashPart}${suffix}`

  // Sort compressible segments by length desc, compress longest first until we fit
  const compressible = segments.slice(0, -1)
  const indexed = compressible.map((s, i) => ({ index: i, length: s.length, segment: s }))
  indexed.sort((a, b) => b.length - a.length)

  let excess = fullName.length + hashPart.length - maxLength
  for (const entry of indexed) {
    if (excess <= 0) {
      break
    }
    if (entry.length <= 3) {
      continue
    }
    const compressed = compressSegment(entry.segment)
    excess -= entry.segment.length - compressed.length
    compressible[entry.index] = compressed
  }

  let compressedPart = compressible.join('_')

  // If still too long, trim the compressed prefix
  let candidate = `${compressedPart}${fixedSuffix}`
  if (candidate.length > maxLength) {
    const trimBy = candidate.length - maxLength
    if (trimBy >= compressedPart.length) {
      throw new Error(
        `Unable to generate identifier for "${fullName}" within maxLength ${maxLength}.`,
      )
    }
    compressedPart = compressedPart.slice(0, compressedPart.length - trimBy).replace(/_+$/, '')
    candidate = `${compressedPart}${fixedSuffix}`
  }

  if (trackingSet.has(candidate)) {
    throw new Error(`Identifier collision: "${candidate}" already exists (from "${fullName}").`)
  }

  trackingSet.add(candidate)
  return candidate
}

/**
 * Compresses a single segment by removing interior vowels and collapsing
 * repeated consonants. Handles underscore-separated sub-parts independently.
 *
 * Examples:
 * - `"ingredients"` → `"ingrdnts"` (interior vowels removed)
 * - `"settings"` → `"stngs"` (vowels removed, `tt` collapsed to `t`)
 * - `"parent_id"` → `"prnt_id"` (each sub-part compressed separately)
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
