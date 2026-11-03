import { appendFile, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { sanitizeOutsideText } from '../sanitize.mjs'

const DEFAULT_SERVER_URL = 'https://github.com'
const DEFAULT_REPOSITORY = 'payloadcms/payload'
const CATALOG_ENTRY_PATTERN = /^\s+(['"]?)(.+?)\1\s*:\s*(['"]?)([^'"#\s]+)\3\s*(#.*)?$/

/**
 * @typedef {object} Plan
 * @property {import('../bumps.mjs').Bump[]} bumps
 * @property {import('../bumps.mjs').PlannedPr[]} prs
 * @property {import('../bumps.mjs').NoFix[]} noFix
 * @property {Record<string, string[]>} originDirs bump id to `packages/` folder names it reaches
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

/** Returns '' for a missing file, so a repo without the file reads as empty. */
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
  if (!Array.isArray(plan?.bumps) || !Array.isArray(plan.prs)) {
    throw new Error('plan is missing bumps or prs')
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

export function findPr({ plan, prId }) {
  const pr = plan.prs.find((candidate) => candidate.id === prId)
  if (!pr) {
    throw new Error(`unknown PR: ${prId}`)
  }

  return pr
}

/**
 * Top-level `catalog:` block of pnpm-workspace.yaml as name to `{ spec }`.
 * @returns {Map<string, { spec: string }>}
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
      catalog.set(match[2], { spec: match[4] })
    }
  }

  return catalog
}

/** Outside text for a single summary or comment line. */
export function toSummaryText({ text, maxLength = 500 }) {
  return sanitizeOutsideText({ text, maxLength })
    .replace(/\s*\r?\n\s*/g, ' ')
    .trim()
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

export function errorMessage({ error }) {
  return error instanceof Error ? error.message : String(error)
}

export function readToken() {
  return process.env.GITHUB_TOKEN || undefined
}

export async function writeSummary({ markdown }) {
  if (!process.env.GITHUB_STEP_SUMMARY) {
    return
  }

  await appendFile(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`)
}

// Workflow command data escaping; messages quote attacker-controlled paths and keys.
export function escapeCommandMessage({ message }) {
  return message.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A')
}
