import { formatAdvisoryMarker } from './report.mjs'
import { stripHtmlComments } from './sanitize.mjs'

const GHSA_PATTERN = /^GHSA(-[23456789cfghjmpqrvwx]{4}){3}$/
const MAX_BODY_LENGTH = 60000
const FRONTMATTER_PATTERN = /^---\r?\n[\s\S]*?\r?\n---\r?\n/
const UNFILLED_TOKEN_PATTERN = /\{\{[^}]*\}\}/

/** Fills `{{key}}` tokens in the template and appends the skill without its frontmatter. */
export function buildPrompt({ context, skill, template }) {
  const values = {
    ...context,
    fixable: context.fixable.map((advisory) => `- ${advisory}`).join('\n'),
  }

  // Single pass so a substituted value is never re-scanned for tokens.
  const filled = template.replace(/\{\{(\w+)\}\}/g, (token, key) =>
    Object.hasOwn(values, key) ? String(values[key]) : token,
  )

  const unfilled = filled.match(UNFILLED_TOKEN_PATTERN)
  if (unfilled) {
    throw new Error(`unfilled prompt token: ${unfilled[0]}`)
  }

  return `${filled}\n\n---\n\n${skill.replace(FRONTMATTER_PATTERN, '').trim()}\n`
}

/** Validates Codex's untrusted final message against the schema and the fixable set. */
export function parseCodexResult({ fixable, text }) {
  let result
  try {
    result = JSON.parse(text)
  } catch {
    throw new Error('codex result is not valid JSON')
  }

  if (
    !Array.isArray(result?.fixedAdvisories) ||
    !Array.isArray(result.needsPerson) ||
    typeof result.body !== 'string'
  ) {
    throw new Error('codex result is missing required fields')
  }

  const { body, fixedAdvisories } = result

  const malformed = fixedAdvisories.filter(
    (advisory) => typeof advisory !== 'string' || !GHSA_PATTERN.test(advisory),
  )
  if (malformed.length > 0) {
    throw new Error(`malformed GHSA in fixedAdvisories: ${malformed.join(', ')}`)
  }

  const outside = fixedAdvisories.filter((advisory) => !fixable.includes(advisory))
  if (outside.length > 0) {
    throw new Error(`claims outside fixable set: ${outside.join(', ')}`)
  }

  if (body.trim() === '') {
    throw new Error('codex result body is empty')
  }
  if (body.length > MAX_BODY_LENGTH) {
    throw new Error(`codex result body exceeds ${MAX_BODY_LENGTH} characters`)
  }

  return { body, fixedAdvisories }
}

/** Assembles the PR body: trusted table first, sanitized agent text, trusted marker last. */
export function buildPrBody({ body, changeTable, fixable }) {
  return (
    '## Changes\n\n' +
    changeTable +
    '\n\n---\n\n## Agent analysis\n\n' +
    stripHtmlComments({ text: body }).trim() +
    '\n\n' +
    formatAdvisoryMarker({ advisories: fixable }) +
    '\n'
  )
}
