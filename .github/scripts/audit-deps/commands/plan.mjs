import { mkdir } from 'node:fs/promises'
import path from 'node:path'

import { buildBumps, buildPrs, listNoFix } from '../bumps.mjs'
import { readReport } from '../report.mjs'
import {
  parseCatalog,
  readOptionalText,
  renderNoFixList,
  requireOption,
  writeJson,
  writeSummary,
} from './shared.mjs'

const WORKSPACE_FILE = 'pnpm-workspace.yaml'
const CATALOG_SPEC = 'catalog:'
const VERSION_PATTERN = /^\d+\.\d+\.\d+(-[\w.]+)?$/

/**
 * `plan --report --scope --ref --out [--cwd]`: writes plan.json.
 * `--cwd` (default: process cwd) holds pnpm-workspace.yaml for `catalog:` specs.
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
  const plan = {
    bumps,
    prs: buildPrs({ bumps, ref }),
    noFix: listNoFix({ report, scope }),
    originDirs: Object.fromEntries(bumps.map((bump) => [bump.id, originDirsFor({ bump, report })])),
  }

  const out = requireOption({ name: 'out', options })
  await mkdir(path.dirname(out), { recursive: true })
  await writeJson({ file: out, value: plan })
  await writeSummary({ markdown: renderPlanSummary({ plan, ref }) })
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
    `${plan.bumps.length} bumps in ${plan.prs.length} PRs.`,
  ]

  lines.push(...renderNoFixList({ noFix: plan.noFix }))
  return lines.join('\n')
}
