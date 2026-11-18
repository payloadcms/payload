const ZERO_WIDTH_SPACE = '​'
const MENTION_PATTERN = /(?<!\w)@(?=\w)/g
const FENCE_PATTERN = /^ {0,3}(`{3,}|~{3,})(.*)$/
const STRUCTURAL_TAG_PATTERN = /<(\/?)(details|summary)/gi
// GitHub turns bare `www.github.com/` text into links and follows protocol-relative `//github.com/`
// links, so the pattern matches both forms.
const GITHUB_URL_PATTERN = /(?:https?:)?\/\/(?:www\.)?github\.com\/|(?<![\w.-])www\.github\.com\//gi

/**
 * Cleans text from outside the repo, such as advisories, release notes and commit messages,
 * before it goes into a PR body. It removes HTML comments, breaks `@name` mentions and issue
 * references, escapes `<details>` and `<summary>` tags so the text cannot break the collapsed
 * sections of the body, and cuts the text to `maxLength`.
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
 * Stops GitHub from adding cross-reference events to other issues and PRs. It breaks `#123` and
 * `owner/repo#123` references and sends github.com links through redirect.github.com.
 */
export function neutralizeIssueRefs({ text }) {
  return text
    .replace(/#(?=\d)/g, `#${ZERO_WIDTH_SPACE}`)
    .replace(GITHUB_URL_PATTERN, 'https://redirect.github.com/')
}

/**
 * Closes a fenced code block that `text` leaves open, so the rest of the PR body does not render
 * as code. Fences match by CommonMark rules.
 */
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

/** Replaces newlines and escapes `|`, so the text stays inside one Markdown table cell. */
export function escapeTableCell({ text }) {
  return String(text ?? '')
    .replace(/\r?\n|\r/g, ' ')
    .replaceAll('|', '\\|')
}

/**
 * Removes all HTML comments. A comment could forge an audit-deps fingerprint, and hidden text
 * can mislead AI reviewers that read the body later. Repeats until the text stops changing, so
 * nested input such as `<!-<!-- -->-` cannot leave a comment behind.
 */
function stripHtmlComments({ text }) {
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
