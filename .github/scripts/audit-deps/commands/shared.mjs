import { appendFile, writeFile } from 'node:fs/promises'

import { sanitizeOutsideText } from '../sanitize.mjs'

const DEFAULT_SERVER_URL = 'https://github.com'
const DEFAULT_REPOSITORY = 'payloadcms/payload'

export function requireOption({ name, options }) {
  const value = options[name]
  if (typeof value !== 'string' || value === '') {
    throw new Error(`missing --${name}`)
  }

  return value
}

export async function writeJson({ file, value }) {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`)
}

/** Sanitizes text from outside the repo and puts it on one line for a summary or comment. */
export function toSummaryText({ text, maxLength = 500 }) {
  return sanitizeOutsideText({ text, maxLength })
    .replace(/\s*\r?\n\s*/g, ' ')
    .trim()
}

/** Renders the findings with no fix as Markdown lines. Returns [] when there are none. */
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

// Escapes a message for a workflow command such as `::error::`. Messages can quote paths and keys
// that an attacker controls, and a raw newline in them would start a new workflow command.
export function escapeCommandMessage({ message }) {
  return message.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A')
}
