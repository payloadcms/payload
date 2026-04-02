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

  // Anchor first segment at string start (e.g., "blocks" matches start of "blocks_0_hero")
  let pattern = `^${escapeRegex(fieldSegments[0]!)}`

  for (let i = 1; i < fieldSegments.length; i++) {
    const segment = escapeRegex(fieldSegments[i]!)

    // (?:_\d+)? - Optional array index (e.g., "_0", "_1")
    pattern += `(?:_\\d+)?`

    // (?:_(?!segment(?:_|$))[^_]+)? - Optional block slug that is NOT the target segment
    // The negative lookahead (?!segment(?:_|$)) prevents matching the target segment itself
    // [^_]+ matches the block slug characters (no underscores allowed in slug portion)
    pattern += `(?:_(?!${segment}(?:_|$))[^_]+)?`

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
