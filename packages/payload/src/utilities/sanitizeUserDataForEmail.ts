/**
 * Sanitizes user data for emails to prevent injection of HTML, executable code, or other malicious content.
 * This function ensures the content is safe by:
 * - Removing HTML tags
 * - Removing control characters
 * - Normalizing whitespace
 * - Escaping special HTML characters
 * - Allowing only letters, numbers, spaces, and basic punctuation
 * - Limiting length (default 100 characters)
 *
 * @param data - data to sanitize
 * @param maxLength - maximum allowed length (default is 100)
 * @returns a sanitized string safe to include in email content
 */
export function sanitizeUserDataForEmail(data: unknown, maxLength = 100): string {
  if (typeof data !== 'string') {
    return ''
  }

  // Remove HTML tags
  const noTags = data.replace(/<[^>]+>/g, '')

  // Remove control characters except common whitespace
  const noControls = [...noTags]
    .filter((char) => {
      const code = char.charCodeAt(0)
      return (
        (code >= 32 && code <= 126) || // standard characters
        code === 9 || // tab
        code === 10 || // new line
        code === 13 // return
      )
    })
    .join('')

  // Normalize whitespace (spaces, tabs, new lines) to single spaces
  const normalizedWhitespace = noControls.replace(/\s+/g, ' ')

  // Escape special HTML characters
  const escaped = normalizedWhitespace
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Allow only letters, numbers, spaces, and common punctuation
  const cleaned = escaped.replace(/[^a-z0-9 .,!?'"-]/gi, '')

  // Trim and limit length, trim again to remove trailing spaces
  return cleaned.slice(0, maxLength).trim()
}
