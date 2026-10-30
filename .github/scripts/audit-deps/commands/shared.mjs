import { appendFile, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { parseResearchResult } from '../codex-contract.mjs'
import { neutralizeIssueRefs, sanitizeOutsideText } from '../sanitize.mjs'

const DEFAULT_SERVER_URL = 'https://github.com'
const DEFAULT_REPOSITORY = 'payloadcms/payload'
const STEP_PATTERN = /^[a-z][\w:.-]{0,39}$/i
const CATALOG_ENTRY_PATTERN = /^\s+(['"]?)(.+?)\1\s*:\s*(['"]?)([^'"#\s]+)\3\s*(#.*)?$/

/**
 * @typedef {object} Plan
 * @property {import('../bumps.mjs').Bump[]} bumps
 * @property {import('../bumps.mjs').Unit[]} units
 * @property {import('../bumps.mjs').NoFix[]} noFix
 * @property {string[]} research ids of bumps to research this run
 * @property {import('../store.mjs').StoreEntry[]} stored fresh stored outcomes for this ref
 * @property {Record<string, string[]>} originDirs bump id to `packages/` folder names it reaches
 *
 * @typedef {object} VerifyResult
 * @property {string[]} passed
 * @property {Array<{ bumpId: string, step: string }>} failed
 */

export function requireOption({ name, options }) {
  const value = options[name]
  if (typeof value !== 'string' || value === '') {
    throw new Error(`missing --${name}`)
  }

  return value
}

export async function readJson({ file }) {
  const text = await readFile(file, 'utf8')
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`${file} is not valid JSON`)
  }
}

export async function writeJson({ file, value }) {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`)
}

/** Returns '' for a missing file, so a first run starts from an empty store. */
export async function readOptionalText({ file }) {
  try {
    return await readFile(file, 'utf8')
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return ''
    }
    throw error
  }
}

/** @returns {Promise<Plan>} */
export async function readPlan({ options }) {
  const plan = await readJson({ file: requireOption({ name: 'plan', options }) })
  if (!Array.isArray(plan?.bumps) || !Array.isArray(plan.units)) {
    throw new Error('plan is missing bumps or units')
  }

  return plan
}

export function findBump({ plan, bumpId }) {
  const bump = plan.bumps.find((candidate) => candidate.id === bumpId)
  if (!bump) {
    throw new Error(`unknown bump: ${bumpId}`)
  }

  return bump
}

export function findUnit({ plan, unitId }) {
  const unit = plan.units.find((candidate) => candidate.id === unitId)
  if (!unit) {
    throw new Error(`unknown unit: ${unitId}`)
  }

  return unit
}

export function findStoredEntry({ plan, bump }) {
  return (
    (plan.stored ?? []).find(
      (entry) => entry.dependency === bump.dependency && entry.to === bump.to,
    ) ?? null
  )
}

/** A major counts as declined when Codex declined it today or the store holds an outcome for it. */
export function isMajorDeclined({ majorId, plan, research }) {
  const major = findBump({ plan, bumpId: majorId })

  return (
    research[majorId]?.decision === 'decline' || findStoredEntry({ plan, bump: major }) !== null
  )
}

/**
 * Top-level `catalog:` block of pnpm-workspace.yaml as name to `{ spec, line }` (1-based).
 * @returns {Map<string, { spec: string, line: number }>}
 */
export function parseCatalog({ text }) {
  const lines = text.split('\n')
  const catalog = new Map()
  const start = lines.findIndex((line) => /^catalog:\s*(#.*)?$/.test(line))
  if (start === -1) {
    return catalog
  }

  for (let index = start + 1; index < lines.length; index++) {
    if (/^\S/.test(lines[index])) {
      break
    }
    const match = CATALOG_ENTRY_PATTERN.exec(lines[index])
    if (match) {
      catalog.set(match[2], { spec: match[4], line: index + 1 })
    }
  }

  return catalog
}

export function parseBumpIds({ options }) {
  const raw = requireOption({ name: 'bump-ids', options })

  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('--bump-ids is not valid JSON')
  }

  if (!Array.isArray(parsed) || !parsed.every((value) => typeof value === 'string')) {
    throw new Error('--bump-ids must be a JSON array of strings')
  }

  return parsed
}

/**
 * Reads `<researchDir>/<bumpId>.json` for each id. A missing or invalid file maps to null,
 * which every caller treats as "not applied".
 * @returns {Promise<Record<string, import('../codex-contract.mjs').ResearchResult | null>>}
 */
export async function readResearchResults({ bumpIds, researchDir }) {
  const entries = await Promise.all(
    bumpIds.map(async (bumpId) => {
      try {
        const text = await readFile(path.join(researchDir, `${bumpId}.json`), 'utf8')
        return [bumpId, parseResearchResult({ text })]
      } catch {
        return [bumpId, null]
      }
    }),
  )

  return Object.fromEntries(entries)
}

/**
 * Reads `<verifyDir>/<unitId>.json`. Verify runs package scripts, so the file is checked
 * for shape, ids outside the unit are dropped, and odd step names become `verify`.
 * @returns {Promise<VerifyResult | null>}
 */
export async function readVerifyResult({ unit, verifyDir }) {
  let value
  try {
    value = JSON.parse(await readFile(path.join(verifyDir, `${unit.id}.json`), 'utf8'))
  } catch {
    return null
  }

  const isValid =
    Array.isArray(value?.passed) &&
    value.passed.every((bumpId) => typeof bumpId === 'string') &&
    Array.isArray(value.failed) &&
    value.failed.every(
      (failure) => typeof failure?.bumpId === 'string' && typeof failure.step === 'string',
    )
  if (!isValid) {
    return null
  }

  const isInUnit = (bumpId) => unit.bumpIds.includes(bumpId)
  return {
    passed: value.passed.filter(isInUnit),
    failed: value.failed
      .filter((failure) => isInUnit(failure.bumpId))
      .map((failure) => ({
        bumpId: failure.bumpId,
        step: STEP_PATTERN.test(failure.step) ? failure.step : 'verify',
      })),
  }
}

/** Outside text for a single summary or comment line. */
export function toSummaryText({ text, maxLength = 500 }) {
  return neutralizeIssueRefs({
    text: sanitizeOutsideText({ text, maxLength })
      .replace(/\s*\r?\n\s*/g, ' ')
      .trim(),
  })
}

/** Markdown lines for the no-fix list; empty when there is none. */
export function renderNoFixList({ noFix }) {
  if (noFix.length === 0) {
    return []
  }

  const rows = noFix.map((item) => {
    const advisory = toSummaryText({ text: item.advisory, maxLength: 40 })
    const severity = toSummaryText({ text: item.severity, maxLength: 20 })
    const module = toSummaryText({ text: item.module, maxLength: 200 })
    return `- ${advisory} (${severity}) in ${module}: ${toSummaryText({ text: item.reason })}`
  })
  return ['', '### No fix available', '', ...rows]
}

export function repoUrlFromEnv() {
  const serverUrl = process.env.GITHUB_SERVER_URL || DEFAULT_SERVER_URL
  const repository = process.env.GITHUB_REPOSITORY || DEFAULT_REPOSITORY

  return `${serverUrl}/${repository}`
}

/**
 * Production uses global fetch. `AUDIT_DEPS_FETCH_FIXTURES` names a JSON map of URL to
 * `{ status, body }` for tests; unknown URLs get 404.
 */
export async function createFetch() {
  const fixturesPath = process.env.AUDIT_DEPS_FETCH_FIXTURES
  if (!fixturesPath) {
    return globalThis.fetch
  }

  const fixtures = await readJson({ file: fixturesPath })
  return async (url) => {
    const fixture = Object.hasOwn(fixtures, String(url)) ? fixtures[String(url)] : null
    if (!fixture) {
      return new Response('', { status: 404 })
    }
    const body = typeof fixture.body === 'string' ? fixture.body : JSON.stringify(fixture.body)
    return new Response(body, { status: fixture.status ?? 200 })
  }
}

export function readToken() {
  return process.env.GITHUB_TOKEN || undefined
}

export async function writeOutputs({ values }) {
  const entries = Object.entries(values)
  const badKey = entries.find(([, value]) => /[\r\n]/.test(value))?.[0]
  if (badKey) {
    throw new Error(`output ${badKey} contains a line break`)
  }
  if (!process.env.GITHUB_OUTPUT) {
    return
  }

  await appendFile(
    process.env.GITHUB_OUTPUT,
    entries.map(([key, value]) => `${key}=${value}\n`).join(''),
  )
}

export async function writeSummary({ markdown }) {
  if (!process.env.GITHUB_STEP_SUMMARY) {
    return
  }

  await appendFile(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`)
}

export function failWithReasons({ reasons }) {
  if (reasons.length === 0) {
    return
  }

  for (const reason of reasons) {
    process.stdout.write(`::error::${escapeCommandMessage({ message: reason })}\n`)
  }
  process.exitCode = 1
}

// Workflow command data escaping; messages quote attacker-controlled paths and keys.
export function escapeCommandMessage({ message }) {
  return message.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A')
}
