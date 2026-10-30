const ZERO_WIDTH_SPACE = '​'
const MENTION_PATTERN = /(?<!\w)@(?=\w)/g
const FENCE_PATTERN = /^ {0,3}(`{3,}|~{3,})(.*)$/
const STRUCTURAL_TAG_PATTERN = /<(\/?)(details|summary)/gi
// GitHub autolinks bare `www.` hosts and resolves protocol-relative links, so both count.
const GITHUB_URL_PATTERN = /(?:https?:)?\/\/(?:www\.)?github\.com\/|(?<![\w.-])www\.github\.com\//gi

/**
 * Cleans text from outside the repo (advisories, release notes, commits, Codex) before it
 * enters a PR body: removes HTML comments, breaks `@name` mentions, neutralizes structural
 * tags, and cuts at `maxLength`.
 */
export function sanitizeOutsideText({ text, maxLength }) {
  const cleaned = neutralizeIssueRefs({
    text: stripHtmlComments({ text: String(text ?? '') })
      .replace(MENTION_PATTERN, `@${ZERO_WIDTH_SPACE}`)
      .replace(STRUCTURAL_TAG_PATTERN, '&lt;$1$2'),
  })

  if (cleaned.length <= maxLength) {
    return cleaned
  }
  return `${cleaned.slice(0, Math.max(0, maxLength - 1))}…`
}

export const GHSA_PATTERN = /^GHSA(-[23456789cfghjmpqrvwx]{4}){3}$/

/**
 * Stops GitHub from creating cross-reference events on other repos: breaks `#123` and
 * `owner/repo#123`, and routes github.com links through the redirect host.
 */
export function neutralizeIssueRefs({ text }) {
  return text
    .replace(/#(?=\d)/g, `#${ZERO_WIDTH_SPACE}`)
    .replace(GITHUB_URL_PATTERN, 'https://redirect.github.com/')
}

/** Appends the closing fence for a fenced code block left open, per CommonMark fence rules. */
export function closeOpenFence({ text }) {
  let openFence = null

  for (const line of text.split('\n')) {
    const match = FENCE_PATTERN.exec(line)
    if (!match) {
      continue
    }

    const [, fence, rest] = match
    if (!openFence) {
      const isBacktickInfoInvalid = fence[0] === '`' && rest.includes('`')
      openFence = isBacktickInfoInvalid ? null : fence
      continue
    }

    const isClosing = fence[0] === openFence[0] && fence.length >= openFence.length
    if (isClosing && rest.trim() === '') {
      openFence = null
    }
  }

  return openFence ? `${text}\n${openFence}` : text
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
