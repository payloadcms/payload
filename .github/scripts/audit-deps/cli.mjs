#!/usr/bin/env node
import { execFile } from 'node:child_process'
import { appendFile, readFile, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { parseArgs, promisify } from 'node:util'

import { buildPrBody, buildPrompt, parseCodexResult } from './codex-contract.mjs'
import {
  diffManifest,
  diffWorkspaceYaml,
  renderChangeTable,
  selectAllowedDependencies,
} from './content-guard.mjs'
import { findDisallowedChanges, listWorkingTreeChanges } from './path-guard.mjs'
import { findUnfixedClaims, readReport, selectFixableAdvisories } from './report.mjs'

const execFileAsync = promisify(execFile)

const WORKSPACE_FILE = 'pnpm-workspace.yaml'

const OPTION_NAMES = [
  'cwd',
  'fixable',
  'out',
  'ref',
  'report',
  'result',
  'scope',
  'severity',
  'skill',
  'template',
]

const COMMANDS = {
  'build-prompt': runBuildPrompt,
  'check-fixed': runCheckFixed,
  'content-guard': runContentGuard,
  'path-guard': runPathGuard,
  'pr-body': runPrBody,
  summarize: runSummarize,
}

main().catch((error) => {
  process.stdout.write(`::error::${escapeCommandMessage({ message: errorMessage({ error }) })}\n`)
  process.exitCode = 1
})

async function main() {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: Object.fromEntries(OPTION_NAMES.map((name) => [name, { type: 'string' }])),
  })

  const command = COMMANDS[positionals[0]]
  if (!Object.hasOwn(COMMANDS, positionals[0]) || !command) {
    throw new Error(`unknown command: ${positionals[0]}`)
  }

  await command({ options: values })
}

async function runSummarize({ options }) {
  const report = await readReport({ path: requireOption({ name: 'report', options }) })
  const fixable = selectFixableAdvisories({
    report,
    scope: requireOption({ name: 'scope', options }),
  })

  await writeOutputs({
    values: { fixable: JSON.stringify(fixable), has_findings: String(report.findings.length > 0) },
  })
  await writeSummary({ markdown: renderFindingsTable({ fixable, report }) })
}

async function runBuildPrompt({ options }) {
  const reportPath = requireOption({ name: 'report', options })
  const [template, skill] = await Promise.all([
    readFile(requireOption({ name: 'template', options }), 'utf8'),
    readFile(requireOption({ name: 'skill', options }), 'utf8'),
  ])

  const prompt = buildPrompt({
    context: {
      fixable: parseFixable({ options }),
      ref: requireOption({ name: 'ref', options }),
      reportPath,
      scope: requireOption({ name: 'scope', options }),
      severity: requireOption({ name: 'severity', options }),
    },
    skill,
    template,
  })

  await writeFile(requireOption({ name: 'out', options }), prompt)
}

async function runPathGuard({ options }) {
  const changes = await listWorkingTreeChanges({ cwd: options.cwd ?? process.cwd() })

  failWithReasons({ reasons: findDisallowedChanges({ changes }) })
}

async function runCheckFixed({ options }) {
  const report = await readReport({ path: requireOption({ name: 'report', options }) })
  const text = await readFile(requireOption({ name: 'result', options }), 'utf8')
  const { body, fixedAdvisories } = parseCodexResult({ fixable: parseFixable({ options }), text })

  await writeSummary({ markdown: body })

  const unfixed = findUnfixedClaims({ claimed: fixedAdvisories, report })
  if (unfixed.length > 0) {
    throw new Error(`claimed fixes still reported by the re-audit: ${unfixed.join(', ')}`)
  }
}

async function runContentGuard({ options }) {
  const { violations } = await diffChangedManifests({ options })

  failWithReasons({ reasons: violations })
}

async function runPrBody({ options }) {
  const fixable = parseFixable({ options })
  const text = await readFile(requireOption({ name: 'result', options }), 'utf8')
  const { body } = parseCodexResult({ fixable, text })

  const { changes, violations } = await diffChangedManifests({ options })
  failWithReasons({ reasons: violations })

  const changeTable = renderChangeTable({ advisories: fixable, changes })

  await writeFile(
    requireOption({ name: 'out', options }),
    buildPrBody({ body, changeTable, fixable }),
  )
}

async function diffChangedManifests({ options }) {
  const cwd = options.cwd ?? process.cwd()
  const scope = requireOption({ name: 'scope', options })
  const report = await readReport({ path: requireOption({ name: 'report', options }) })
  const { majors, names: allowed } = selectAllowedDependencies({ report, scope })

  const changedFiles = (await listWorkingTreeChanges({ cwd })).filter(({ path }) =>
    isDiffedPath({ path }),
  )

  const changes = []
  const violations = []

  for (const { path } of changedFiles) {
    const before = await readHeadFile({ cwd, path })
    if (before === null) {
      violations.push(`${path}: added file not allowed (no version at HEAD)`)
      continue
    }

    const after = await readDiskFile({ cwd, path })
    if (after === null) {
      violations.push(`${path}: file missing from the working tree`)
      continue
    }

    const result =
      path === WORKSPACE_FILE
        ? diffWorkspaceYaml({ after, allowed, before, majors, scope })
        : diffManifest({ after, allowed, before, file: path, majors })

    changes.push(...result.changes)
    violations.push(...result.violations)
  }

  return { changes, violations }
}

// pnpm-lock.yaml is verified by clean regeneration elsewhere.
function isDiffedPath({ path }) {
  return path === WORKSPACE_FILE || basename(path) === 'package.json'
}

async function readHeadFile({ cwd, path }) {
  try {
    const { stdout } = await execFileAsync('git', ['show', `HEAD:${path}`], {
      cwd,
      maxBuffer: 64 * 1024 * 1024,
    })
    return stdout
  } catch {
    return null
  }
}

async function readDiskFile({ cwd, path }) {
  try {
    return await readFile(join(cwd, path), 'utf8')
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return null
    }
    throw error
  }
}

function failWithReasons({ reasons }) {
  if (reasons.length === 0) {
    return
  }

  for (const reason of reasons) {
    process.stdout.write(`::error::${escapeCommandMessage({ message: reason })}\n`)
  }
  process.exitCode = 1
}

function parseFixable({ options }) {
  const raw = requireOption({ name: 'fixable', options })

  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('--fixable is not valid JSON')
  }

  if (!Array.isArray(parsed) || !parsed.every((value) => typeof value === 'string')) {
    throw new Error('--fixable must be a JSON array of strings')
  }

  return parsed
}

function requireOption({ name, options }) {
  const value = options[name]
  if (typeof value !== 'string' || value === '') {
    throw new Error(`missing --${name}`)
  }

  return value
}

async function writeOutputs({ values }) {
  if (!process.env.GITHUB_OUTPUT) {
    return
  }

  const lines = Object.entries(values).map(([key, value]) => `${key}=${value}\n`)
  await appendFile(process.env.GITHUB_OUTPUT, lines.join(''))
}

async function writeSummary({ markdown }) {
  if (!process.env.GITHUB_STEP_SUMMARY) {
    return
  }

  await appendFile(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`)
}

function renderFindingsTable({ fixable, report }) {
  if (report.findings.length === 0) {
    return '## Audit findings\n\nNo findings.'
  }

  const rows = report.findings.map((finding) => {
    const status = fixable.includes(finding.advisory) ? 'fixable' : 'needs a person'

    return `| ${escapeCell({ value: finding.advisory })} | ${escapeCell({ value: finding.package })} | ${status} |`
  })

  return [
    '## Audit findings',
    '',
    '| Advisory | Package | Fix status |',
    '| --- | --- | --- |',
    ...rows,
  ].join('\n')
}

function escapeCell({ value }) {
  return String(value)
    .replace(/[\r\n]+/g, ' ')
    .replaceAll('|', '\\|')
}

// Workflow command data escaping; messages quote attacker-controlled paths and keys.
function escapeCommandMessage({ message }) {
  return message.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A')
}

function errorMessage({ error }) {
  return error instanceof Error ? error.message : String(error)
}
