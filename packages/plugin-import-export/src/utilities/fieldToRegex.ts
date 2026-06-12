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

  // Anchor first segment at string start
  let pattern = `^${escapeRegex(fieldSegments[0]!)}`

  for (let i = 1; i < fieldSegments.length; i++) {
    const segment = escapeRegex(fieldSegments[i]!)

    // (?:_\d+)* - Zero or more array indices (e.g., "_0", "_0_1" for nested arrays)
    pattern += `(?:_\\d+)*`

    // _segment - Required underscore followed by the field segment
    pattern += `_${segment}`
  }

  // (?:_.*)?$ - Allow any trailing content (nested fields, additional indices)
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
