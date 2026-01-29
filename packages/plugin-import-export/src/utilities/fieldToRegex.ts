/**
 * Creates a regex that checks if a flattened CSV key matches a dotted field path.
 *
 * For example, `blocks.content.richText` would match:
 * - `blocks_0_content_richText`
 * - `blocks_1_content_0_richText`
 * - `blocks_content_richText` (no indices)
 *
 * The regex handles the underscore-separated flattened format where array indices
 * are inserted between field names. Field names themselves may contain underscores
 * (e.g., `_status`, `my_field`).
 */
export const fieldToRegex = (fieldPath: string): RegExp => {
  const fieldSegments = fieldPath.split('.')

  // First segment is anchored at start
  let pattern = `^${escapeRegex(fieldSegments[0]!)}`

  // For each subsequent segment, allow optional array indices (one or more)
  for (let i = 1; i < fieldSegments.length; i++) {
    const segment = escapeRegex(fieldSegments[i]!)
    // Optional array indices: (_digits)* before each segment
    pattern += `(?:_\\d+)*`
    // Required underscore + segment
    pattern += `_${segment}`
  }

  // Allow trailing content (nested fields, indices, etc.)
  pattern += `(?:_.*)?$`

  return new RegExp(pattern)
}

/**
 * Escapes special regex metacharacters so they match literally.
 * Characters escaped: . * + ? ^ $ { } ( ) | [ ] \
 */
const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
