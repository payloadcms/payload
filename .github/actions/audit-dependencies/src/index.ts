import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import type { AdvisoryHit, Scope } from './types'

import { loadAllowlist } from './lib/allowlist'
import { annotateFindings } from './lib/bumpAdvisor'
import { loadCatalogs } from './lib/catalog'
import { parseArgs } from './lib/cli'
import { runConsumerAudit } from './lib/consumerAudit'
import { runMonorepoAudit } from './lib/monorepoAudit'
import { buildDeclaredIndex, scanPackages, selectConsumerPackages } from './lib/packages'
import { createRegistryClient } from './lib/registry'
import {
  findStaleAllowlist,
  printAllowlistReview,
  printReport,
  toFinding,
  toFindings,
} from './lib/report'
import { isFixable } from './lib/severity'

const ALLOWLIST_PATH = '.github/audit-dependencies-allowlist.json'

const main = async (): Promise<number> => {
  const parsed = parseArgs({ argv: process.argv.slice(2), env: process.env })
  if (!parsed.ok) {
    console.error(`Error: ${parsed.error}`)
    return 2
  }

  const { jsonPath, scope, severity } = parsed.options
  const repoRoot = process.cwd()

  const allow = await loadAllowlist({
    path: join(repoRoot, ALLOWLIST_PATH),
    scope,
    today: new Date(),
  })
  if (!allow.ok) {
    console.error(`Error: ${allow.error}`)
    return allow.kind === 'config' ? 2 : 1
  }

  const ignoreGhsas = allow.allowlist.activeGhsas

  console.log(`Auditing ${scope} for ${severity} vulnerabilities...`)

  const [manifests, catalogs] = await Promise.all([
    scanPackages({ repoRoot }),
    loadCatalogs({ repoRoot }),
  ])
  const { hits, packagesAudited } = await audit({ catalogs, manifests, repoRoot, scope })

  for (const stale of findStaleAllowlist({ entries: allow.allowlist.entries, hits, scope })) {
    console.warn(
      `Warning: allowlist entry ${stale} no longer matches any advisory; consider removing it.`,
    )
  }

  const client = createRegistryClient()
  const index = buildDeclaredIndex(manifests, catalogs)

  const findings = toFindings({ hits, ignoreGhsas, threshold: severity })
  const reported = await annotateFindings({ client, findings, index })

  await writeFile(jsonPath, JSON.stringify(reported, null, 2))
  printReport({ findings: reported, jsonPath, packagesAudited, scope, severity })

  // Re-review the allowlist: an advisory suppressed earlier may now be resolvable.
  const allowlisted = new Set(ignoreGhsas)
  const allowlistFindings = hits
    .filter((hit) => allowlisted.has(hit.advisory.github_advisory_id))
    .filter((hit) => isFixable(hit.advisory.patched_versions))
    .map(toFinding)
  const reviewed = await annotateFindings({ client, findings: allowlistFindings, index })
  printAllowlistReview(reviewed)

  return reported.length > 0 ? 1 : 0
}

const audit = async ({
  catalogs,
  manifests,
  repoRoot,
  scope,
}: {
  catalogs: Awaited<ReturnType<typeof loadCatalogs>>
  manifests: Awaited<ReturnType<typeof scanPackages>>
  repoRoot: string
  scope: Scope
}): Promise<{ hits: AdvisoryHit[]; packagesAudited: number }> => {
  if (scope === 'monorepo') {
    return { hits: await runMonorepoAudit({ cwd: repoRoot }), packagesAudited: 1 }
  }

  const packages = selectConsumerPackages(manifests, catalogs)
  const hits = await runConsumerAudit({ packages })
  return { hits, packagesAudited: packages.length }
}

main()
  .then((code) => {
    process.exit(code)
  })
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
