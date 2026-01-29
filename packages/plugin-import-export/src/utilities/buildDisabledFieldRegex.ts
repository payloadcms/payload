/**
 * Creates a regex that checks if a flattened CSV key should be disabled based on a dot-notated path.
 *
 * Unlike fieldToRegex, this allows block type slugs between field segments.
 * For example, `blocks.content` would match:
 * - `blocks_content`
 * - `blocks_0_content`
 * - `blocks_0_hero_content` (hero is a block type slug)
 * - `blocks_content_title` (nested field)
 *
 * Field names themselves may contain underscores (e.g., `_status`, `my_field`).
 */
export const buildDisabledFieldRegex = (fieldPath: string): RegExp => {
  const fieldSegments = fieldPath.split('.')

  // First segment is anchored at start
  let pattern = `^${escapeRegex(fieldSegments[0]!)}`

  // For each subsequent segment, allow optional array index and block type slug
  for (let i = 1; i < fieldSegments.length; i++) {
    const segment = escapeRegex(fieldSegments[i]!)
    // Optional array index: _digits
    pattern += `(?:_\\d+)?`
    // Optional block slug (but not the target segment via negative lookahead): _chars
    pattern += `(?:_(?!${segment}(?:_|$))[^_]+)?`
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
