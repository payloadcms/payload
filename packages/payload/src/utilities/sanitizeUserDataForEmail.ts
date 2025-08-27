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

  // Decode HTML numeric entities like &#x3C; or &#60;
  const decodedEntities = data
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))

  // Remove HTML tags
  const noTags = decodedEntities.replace(/<[^>]+>/g, '')

  const noInvisible = noTags.replace(/[\u200B-\u200F\u2028-\u202F\u2060-\u206F\uFEFF]/g, '')

  // Remove control characters except common whitespace
  const noControls = [...noInvisible]
    .filter((char) => {
      const code = char.charCodeAt(0)
      return (
        code >= 32 || // printable and above
        code === 9 || // tab
        code === 10 || // new line
        code === 13 // return
      )
    })
    .join('')

  // Remove '(?' and backticks `
  let noInjectionSyntax = noControls.replace(/\(\?/g, '').replace(/`/g, '')

  // {{...}} remove braces but keep inner content
  noInjectionSyntax = noInjectionSyntax.replace(/\{\{(.*?)\}\}/g, '$1')

  // Escape special HTML characters
  const escaped = noInjectionSyntax
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Normalize whitespace to single space
  const normalizedWhitespace = escaped.replace(/\s+/g, ' ')

  // Allow:
  // - Unicode letters (\p{L})
  // - Unicode numbers (\p{N})
  // - Unicode marks (\p{M}, e.g. accents)
  // - Unicode spaces (\p{Zs})
  // - Punctuation: common ascii + inverted ! and ?
  const allowedPunctuation = " .,!?'" + '"¡¿、！（）〆-'

  // Escape regex special characters
  const escapedPunct = allowedPunctuation.replace(/[[\]\\^$*+?.()|{}]/g, '\\$&')

  const pattern = `[^\\p{L}\\p{N}\\p{M}\\p{Zs}${escapedPunct}]`

  const cleaned = normalizedWhitespace.replace(new RegExp(pattern, 'gu'), '')

  // Trim and limit length, trim again to remove trailing spaces
  return cleaned.slice(0, maxLength).trim()
}
