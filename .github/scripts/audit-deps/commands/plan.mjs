import path from 'node:path'

import { buildBumps, buildUnits, listNoFix } from '../bumps.mjs'
import { readReport } from '../report.mjs'
import { readStore, selectResearchBumps } from '../store.mjs'
import {
  readOptionalText,
  renderNoFixList,
  requireOption,
  toSummaryText,
  writeJson,
  writeOutputs,
  writeSummary,
} from './shared.mjs'

const WORKSPACE_FILE = 'pnpm-workspace.yaml'
const CATALOG_SPEC = 'catalog:'
const CATALOG_ENTRY_PATTERN = /^\s+(['"]?)(.+?)\1\s*:\s*(['"]?)([^'"#\s]+)\3\s*(#.*)?$/
const VERSION_PATTERN = /^\d+\.\d+\.\d+(-[\w.]+)?$/

/**
 * `plan --report --scope --ref --store --out [--cwd]`: writes plan.json. `--store` may name a
 * missing file. `--cwd` (default: process cwd) holds pnpm-workspace.yaml for `catalog:` specs.
 */
export async function runPlan({ options }) {
  const cwd = options.cwd ?? process.cwd()
  const ref = requireOption({ name: 'ref', options })
  const scope = requireOption({ name: 'scope', options })
  const report = await readReport({ path: requireOption({ name: 'report', options }) })
  const catalog = parseCatalog({
    text: await readOptionalText({ file: path.join(cwd, WORKSPACE_FILE) }),
  })

  const bumps = buildBumps({ report }).map((bump) => withCatalogVersion({ bump, catalog }))
  const entries = readStore({
    text: await readOptionalText({ file: requireOption({ name: 'store', options }) }),
  })
  const { research, stored } = selectResearchBumps({ bumps, entries, ref })
  const plan = {
    bumps,
    units: buildUnits({ bumps, ref }),
    noFix: listNoFix({ report, scope }),
    research: research.map((bump) => bump.id),
    stored,
    originDirs: Object.fromEntries(bumps.map((bump) => [bump.id, originDirsFor({ bump, report })])),
  }

  await writeJson({ file: requireOption({ name: 'out', options }), value: plan })
  await writeOutputs({ values: { has_findings: String(report.findings.length > 0) } })
  await writeSummary({ markdown: renderPlanSummary({ plan, ref }) })
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

function withCatalogVersion({ bump, catalog }) {
  if (bump.fromVersion || bump.from !== CATALOG_SPEC) {
    return bump
  }

  const version = (catalog.get(bump.dependency)?.spec ?? '').replace(/^[\^~]/, '')
  return VERSION_PATTERN.test(version) ? { ...bump, fromVersion: version } : bump
}

function originDirsFor({ bump, report }) {
  const dirs = report.findings
    .filter((finding) => bump.advisories.includes(finding.advisory))
    .flatMap((finding) => finding.originPackages ?? [])

  return [...new Set(dirs)].sort()
}

function renderPlanSummary({ plan, ref }) {
  const lines = [
    `## Audit plan (${ref})`,
    '',
    `${plan.bumps.length} bumps in ${plan.units.length} units; ${plan.research.length} to research.`,
  ]

  if (plan.stored.length > 0) {
    lines.push('', '### Stored outcomes', '')
    for (const entry of plan.stored) {
      const name = toSummaryText({ text: `${entry.dependency} ${entry.to}`, maxLength: 200 })
      const reason = toSummaryText({ text: entry.reason })
      lines.push(`- ${name}: ${entry.outcome} on ${entry.at.slice(0, 10)}: ${reason}`)
    }
  }

  lines.push(...renderNoFixList({ noFix: plan.noFix }))
  return lines.join('\n')
}
