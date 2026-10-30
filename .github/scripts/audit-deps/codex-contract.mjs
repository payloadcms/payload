import { formatAdvisoryMarker } from './report.mjs'
import { GHSA_PATTERN, stripHtmlComments } from './sanitize.mjs'

/**
 * @typedef {object} ResearchResult
 * @property {'apply' | 'decline'} decision
 * @property {Array<{ change: string, ourUsage: string }>} breakingChanges
 * @property {string[]} filesChecked
 * @property {string} reason non-empty for `decline`
 */

const MAX_BODY_LENGTH = 60000
const MAX_RESEARCH_STRING_LENGTH = 4000
const MAX_BREAKING_CHANGES = 30
const FRONTMATTER_PATTERN = /^---\r?\n[\s\S]*?\r?\n---\r?\n/
const UNFILLED_TOKEN_PATTERN = /\{\{[^}]*\}\}/

/**
 * Fills the research prompt for one bump and appends the skill without its frontmatter.
 * @param {{ bump: import('./bumps.mjs').Bump, evidencePaths: { notesPath: string, pinHistoryPath: string }, hasNotes: boolean, ref: string, skill: string, template: string }} params
 */
export function buildResearchPrompt({ bump, evidencePaths, hasNotes, ref, skill, template }) {
  const values = {
    advisories: bump.advisories.map((advisory) => `- ${advisory}`).join('\n'),
    dependency: bump.dependency,
    evidenceMode: hasNotes ? 'release notes' : 'package diff',
    from: bump.fromVersion || bump.from,
    kind: bump.isMajor ? 'major' : 'non-major',
    notesPath: evidencePaths.notesPath,
    pinHistoryPath: evidencePaths.pinHistoryPath,
    ref,
    to: bump.to,
  }

  return fillTemplate({ skill, template, values })
}

/**
 * Validates Codex's untrusted final message and returns only the schema keys.
 * @param {{ text: string }} params
 * @returns {ResearchResult}
 */
export function parseResearchResult({ text }) {
  let result
  try {
    result = JSON.parse(text)
  } catch {
    throw new Error('codex result is not valid JSON')
  }

  if (
    !Array.isArray(result?.breakingChanges) ||
    !Array.isArray(result.filesChecked) ||
    typeof result.decision !== 'string' ||
    typeof result.reason !== 'string'
  ) {
    throw new Error('codex result is missing required fields')
  }

  const { breakingChanges, decision, filesChecked, reason } = result

  if (decision !== 'apply' && decision !== 'decline') {
    throw new Error(`codex result has an unknown decision: ${decision}`)
  }
  if (decision === 'decline' && reason.trim() === '') {
    throw new Error('codex result declines without a reason')
  }
  if (breakingChanges.length > MAX_BREAKING_CHANGES) {
    throw new Error(`codex result has more than ${MAX_BREAKING_CHANGES} breakingChanges`)
  }

  const isMalformedChange = (item) =>
    typeof item?.change !== 'string' || typeof item.ourUsage !== 'string'
  if (breakingChanges.some(isMalformedChange)) {
    throw new Error('codex result has a malformed breakingChanges entry')
  }
  if (filesChecked.some((file) => typeof file !== 'string')) {
    throw new Error('codex result has a non-string filesChecked entry')
  }

  const strings = [
    reason,
    ...filesChecked,
    ...breakingChanges.flatMap((item) => [item.change, item.ourUsage]),
  ]
  if (strings.some((value) => value.length > MAX_RESEARCH_STRING_LENGTH)) {
    throw new Error(`codex result has a string over ${MAX_RESEARCH_STRING_LENGTH} characters`)
  }

  return {
    breakingChanges: breakingChanges.map(({ change, ourUsage }) => ({ change, ourUsage })),
    decision,
    filesChecked,
    reason,
  }
}

/** Fills `{{key}}` tokens in the template and appends the skill without its frontmatter. */
export function buildPrompt({ context, skill, template }) {
  const values = {
    ...context,
    fixable: context.fixable.map((advisory) => `- ${advisory}`).join('\n'),
  }

  return fillTemplate({ skill, template, values })
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

/** Single pass so a substituted value is never re-scanned for tokens. */
function fillTemplate({ skill, template, values }) {
  const unfilled = []
  const filled = template.replace(/\{\{(\w+)\}\}/g, (token, key) => {
    if (Object.hasOwn(values, key)) {
      return String(values[key])
    }
    unfilled.push(token)
    return token
  })

  const malformed = template.replace(/\{\{(\w+)\}\}/g, '').match(UNFILLED_TOKEN_PATTERN)?.[0]
  const stray = unfilled[0] ?? malformed
  if (stray) {
    throw new Error(`unfilled prompt token: ${stray}`)
  }

  return `${filled}\n\n---\n\n${skill.replace(FRONTMATTER_PATTERN, '').trim()}\n`
}
