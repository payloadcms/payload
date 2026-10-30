const ZERO_WIDTH_SPACE = '​'
const MENTION_PATTERN = /(^|[^\w@])@(?=\w)/g
const STRUCTURAL_TAG_PATTERN = /<(\/?)(details|summary)/gi

/**
 * Cleans text from outside the repo (advisories, release notes, commits, Codex) before it
 * enters a PR body: removes HTML comments, breaks `@name` mentions, neutralizes structural
 * tags, and cuts at `maxLength`.
 */
export function sanitizeOutsideText({ text, maxLength }) {
  const cleaned = stripHtmlComments({ text: String(text ?? '') })
    .replace(MENTION_PATTERN, `$1@${ZERO_WIDTH_SPACE}`)
    .replace(STRUCTURAL_TAG_PATTERN, '&lt;$1$2')

  if (cleaned.length <= maxLength) {
    return cleaned
  }
  return `${cleaned.slice(0, Math.max(0, maxLength - 1))}…`
}

/** Makes text safe inside one markdown table cell. */
export function escapeTableCell({ text }) {
  return String(text ?? '')
    .replace(/\r?\n|\r/g, ' ')
    .replaceAll('|', '\\|')
}

/**
 * Removes every HTML comment, not only audit-deps markers, because hidden text can steer
 * later AI reviewers. Repeats until stable to defeat nesting like `<!-<!-- -->-`.
 */
export function stripHtmlComments({ text }) {
  let current = text
  let previous
  do {
    previous = current
    current = current
      .replace(/<!--[\s\S]*?-->/g, '')
      .replaceAll('<!--', '')
      .replaceAll('-->', '')
  } while (current !== previous)

  return current
}
