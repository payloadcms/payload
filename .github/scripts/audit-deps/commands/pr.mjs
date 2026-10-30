import { writeFile } from 'node:fs/promises'

import { classifyFixes } from '../bumps.mjs'
import { isDraftUnit, renderUnitBody } from '../pr-body.mjs'
import { readReport } from '../report.mjs'
import {
  fetchAdvisory,
  fetchCommits,
  fetchPackageMeta,
  fetchReleaseNotes,
  fetchWeeklyDownloads,
} from '../upstream.mjs'
import { listPublishedPackages, resolveAffects } from '../workspace-graph.mjs'
import {
  createFetch,
  findBump,
  findUnit,
  parseBumpIds,
  readPlan,
  readResearchResults,
  readToken,
  repoUrlFromEnv,
  requireOption,
  writeOutputs,
} from './shared.mjs'

const BACKPORT_REF = '3.x'

/**
 * `pr-body --plan --unit --bump-ids --report --research-dir --scope --severity --ref --run-url
 * --out [--cwd]`. `--report` is the re-audit after the bumps, for fixed and partly. Affects
 * come from `plan.originDirs`, taken from the precheck audit. Outputs `title` and `is_draft`.
 */
export async function runPrBody({ options }) {
  const plan = await readPlan({ options })
  const planUnit = findUnit({ plan, unitId: requireOption({ name: 'unit', options }) })
  const bumpIds = parseBumpIds({ options })
  const outside = bumpIds.find((bumpId) => !planUnit.bumpIds.includes(bumpId))
  if (outside) {
    throw new Error(`bump ${outside} is not in unit ${planUnit.id}`)
  }
  if (bumpIds.length === 0) {
    throw new Error(`no bumps selected for unit ${planUnit.id}`)
  }

  const unit = { ...planUnit, bumpIds }
  const unitBumps = bumpIds.map((bumpId) => findBump({ plan, bumpId }))
  const ref = requireOption({ name: 'ref', options })
  const reaudit = await readReport({ path: requireOption({ name: 'report', options }) })
  const graph = await listPublishedPackages({ cwd: options.cwd ?? process.cwd() })
  const fetch = await createFetch()
  const token = readToken()

  const details = Object.fromEntries(
    await Promise.all(
      unitBumps.map(async (bump) => [
        bump.id,
        await fetchBumpDetails({ bump, fetch, graph, plan, token }),
      ]),
    ),
  )
  const { fixed, partly } = classifyFixes({ bumps: unitBumps, report: reaudit })
  const research = await readResearchResults({
    bumpIds,
    researchDir: requireOption({ name: 'research-dir', options }),
  })

  const body = renderUnitBody({
    unit,
    bumps: plan.bumps,
    details,
    fixed,
    partly,
    research: Object.fromEntries(Object.entries(research).filter(([, result]) => result)),
    scope: requireOption({ name: 'scope', options }),
    severity: requireOption({ name: 'severity', options }),
    ref,
    repoUrl: repoUrlFromEnv(),
    runUrl: requireOption({ name: 'run-url', options }),
  })

  await writeFile(requireOption({ name: 'out', options }), body)
  await writeOutputs({
    values: {
      is_draft: String(isDraftUnit({ unit, details })),
      title: buildTitle({ ref, unit, unitBumps }),
    },
  })
}

function buildTitle({ ref, unit, unitBumps }) {
  const [first] = unitBumps
  const title =
    unit.kind === 'group'
      ? `fix(deps): bump the non-major group with ${unitBumps.length} updates`
      : `fix(deps): bump ${first.dependency} from ${first.fromVersion || first.from} to ${first.to}`

  return ref === BACKPORT_REF ? `${title} (${BACKPORT_REF})` : title
}

async function fetchBumpDetails({ bump, fetch, graph, plan, token }) {
  const name = bump.dependency
  const packageMeta = await fetchPackageMeta({ fetch, name, version: bump.to })
  const range = { fetch, repo: packageMeta.repo, name, from: bump.fromVersion, to: bump.to, token }

  const [downloads, notes, commits, advisories] = await Promise.all([
    fetchWeeklyDownloads({ fetch, name, version: bump.to }),
    fetchReleaseNotes({ ...range, isMajor: bump.isMajor, includeMinors: false }),
    fetchCommits(range),
    Promise.all(
      bump.advisories.map(async (ghsa) => {
        const advisory = await fetchAdvisory({ fetch, ghsa, token })
        return { ghsa, summary: '', description: '', severity: '', url: '', ...advisory }
      }),
    ),
  ])

  return {
    advisories,
    affects: resolveAffects({ graph, originDirs: plan.originDirs?.[bump.id] ?? [] }),
    commits,
    downloads,
    notes,
    packageMeta,
  }
}
