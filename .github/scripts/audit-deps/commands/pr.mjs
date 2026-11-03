import { classifyFixes } from '../bumps.mjs'
import { isDraftPr, renderPrBody } from '../pr-body.mjs'
import {
  fetchAdvisory,
  fetchCommits,
  fetchPackageMeta,
  fetchReleaseNotes,
  fetchWeeklyDownloads,
} from '../upstream.mjs'
import { bumpsOfPr, findPr } from '../plan.mjs'
import { listPublishedPackages, resolveAffects } from '../workspace-graph.mjs'
import { readToken, repoUrlFromEnv } from './shared.mjs'

const BACKPORT_REF = '3.x'

/**
 * Builds the title, body and draft state of one planned PR. `reaudit` is the audit report taken
 * after the bumps; it decides which advisories the body lists as fixed or partly fixed.
 * @returns {Promise<{ body: string, isDraft: boolean, title: string }>}
 */
export async function buildPr({ cwd, plan, prId, reaudit, ref, runUrl, scope, severity }) {
  const pr = findPr({ plan, prId })
  const prBumps = bumpsOfPr({ plan, pr })
  const graph = await listPublishedPackages({ cwd })
  const token = readToken()

  // Each bump sends about ten GitHub requests at once. One bump at a time keeps a large group PR
  // under GitHub's secondary rate limit, which would drop details from the body without an error.
  const details = {}
  for (const bump of prBumps) {
    details[bump.id] = await fetchBumpDetails({ bump, fetch, graph, plan, token })
  }
  const { fixed, partly } = classifyFixes({ bumps: prBumps, report: reaudit })

  const body = renderPrBody({
    pr,
    bumps: prBumps,
    details,
    fixed,
    partly,
    scope,
    severity,
    ref,
    repoUrl: repoUrlFromEnv(),
    runUrl,
  })

  return { body, isDraft: isDraftPr({ pr }), title: buildTitle({ ref, pr, prBumps }) }
}

export function buildTitle({ ref, pr, prBumps }) {
  const [first] = prBumps
  const title =
    pr.kind === 'group'
      ? `fix(deps): bump the non-major group with ${prBumps.length} updates`
      : `fix(deps): bump ${first.dependency} from ${first.fromVersion || first.from} to ${first.to}`

  return ref === BACKPORT_REF ? `${title} (${BACKPORT_REF})` : title
}

async function fetchBumpDetails({ bump, fetch, graph, plan, token }) {
  const name = bump.dependency
  const packageMeta = await fetchPackageMeta({ fetch, name, version: bump.to })
  const range = { fetch, repo: packageMeta.repo, name, from: bump.fromVersion, to: bump.to, token }

  const [downloads, notes, commits, advisories] = await Promise.all([
    fetchWeeklyDownloads({ fetch, name, version: bump.to }),
    fetchReleaseNotes({ ...range, isMajor: bump.isMajor }),
    fetchCommits(range),
    Promise.all(
      bump.advisories.map(async (ghsa) => {
        const advisory = await fetchAdvisory({ fetch, ghsa, token })
        return { ghsa, summary: '', description: '', severity: '', ...advisory }
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
