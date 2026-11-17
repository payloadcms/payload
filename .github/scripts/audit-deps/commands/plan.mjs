import { mkdir } from 'node:fs/promises'
import path from 'node:path'

import { buildPlan } from '../plan.mjs'
import { readReport } from '../report.mjs'
import { renderNoFixList, requireOption, writeJson, writeSummary } from './shared.mjs'

/** Usage: `plan --report --scope --ref --out`. Writes the bump and PR plan as JSON to `--out`. */
export async function runPlan({ options }) {
  const ref = requireOption({ name: 'ref', options })
  const report = await readReport({ path: requireOption({ name: 'report', options }) })
  const plan = buildPlan({ ref, report, scope: requireOption({ name: 'scope', options }) })

  const out = requireOption({ name: 'out', options })
  await mkdir(path.dirname(out), { recursive: true })
  await writeJson({ file: out, value: plan })
  await writeSummary({ markdown: renderPlanSummary({ plan, ref }) })
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
