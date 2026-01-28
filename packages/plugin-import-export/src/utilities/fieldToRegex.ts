/**
 * Converts a dotted field path to a regex that matches flattened keys with array indices.
 *
 * For example, `blocks.content.richText` would match:
 * - `blocks_0_content_richText`
 * - `blocks_1_content_0_richText`
 * - `blocks_content_richText` (no indices)
 *
 * The regex handles the underscore-separated flattened format where array indices
 * are inserted between field names.
 */
export const fieldToRegex = (field: string): RegExp => {
  const parts = field.split('.').map((part) => `${part}(?:_\\d+)?`)
  const pattern = `^${parts.join('_')}(?:$|_\\d|_[a-zA-Z]+(?:_|$))`
  return new RegExp(pattern)
}
