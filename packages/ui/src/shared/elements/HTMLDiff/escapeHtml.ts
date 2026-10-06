// Unicode Private Use Area characters for temporary escaping during diff.
// These are replaced with HTML entities after the diff is computed.
const ESCAPE_MAP = {
  '"': '\uE004',
  '&': '\uE001',
  "'": '\uE005',
  '<': '\uE002',
  '>': '\uE003',
} as const

const UNESCAPE_MAP = {
  '\uE001': '&amp;',
  '\uE002': '&lt;',
  '\uE003': '&gt;',
  '\uE004': '&quot;',
  '\uE005': '&#39;',
} as const

/**
 * Escapes HTML special characters using Unicode placeholders.
 * These must be converted to HTML entities after diffing using unescapeDiffHTML.
 */
export function escapeDiffHTML(value: boolean | null | number | string | undefined): string {
  if (value == null) {
    return ''
  }

  const str = typeof value === 'string' ? value : String(value)

  return str
    .replace(/&/g, ESCAPE_MAP['&'])
    .replace(/</g, ESCAPE_MAP['<'])
    .replace(/>/g, ESCAPE_MAP['>'])
    .replace(/"/g, ESCAPE_MAP['"'])
    .replace(/'/g, ESCAPE_MAP["'"])
}

/**
 * Converts Unicode placeholder characters to HTML entities.
 * Call this on the final HTML output after diffing.
 */
export function unescapeDiffHTML(html: string): string {
  return html
    .replace(/\uE001/g, UNESCAPE_MAP['\uE001'])
    .replace(/\uE002/g, UNESCAPE_MAP['\uE002'])
    .replace(/\uE003/g, UNESCAPE_MAP['\uE003'])
    .replace(/\uE004/g, UNESCAPE_MAP['\uE004'])
    .replace(/\uE005/g, UNESCAPE_MAP['\uE005'])
}
