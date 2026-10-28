import type { AllowlistEntry } from './allowlist'
import type { AdvisoryHit, Bump, Finding, ReportedFinding, Scope, Severity } from '../types'

import { isFixable, meetsThreshold, severityRank } from './severity'

const BOLD = '[1m'
const GREEN = '[32m'
const RED = '[31m'
const RESET = '[0m'

/**
 * Converts audit hits into reportable findings: keeps only fixable advisories at
 * or above the severity threshold that are not allowlisted, sorted most-severe
 * first then by package name.
 */
export const toFindings = ({
  hits,
  ignoreGhsas,
  threshold,
}: {
  hits: AdvisoryHit[]
  ignoreGhsas: string[]
  threshold: Severity
}): Finding[] => {
  const ignored = new Set(ignoreGhsas)

  return hits
    .filter(({ advisory }) => isFixable(advisory.patched_versions))
    .filter(({ advisory }) => meetsThreshold({ advisorySeverity: advisory.severity, threshold }))
    .filter(({ advisory }) => !ignored.has(advisory.github_advisory_id))
    .map(toFinding)
    .sort(compareFindings)
}

/** Maps a raw audit hit to the reportable Finding shape (no filtering). */
export const toFinding = ({
  advisory,
  chainPackages,
  directDeps,
  originPackages,
  paths,
}: AdvisoryHit): Finding => ({
  advisory: advisory.github_advisory_id,
  chainPackages,
  directDeps,
  fixed_in: advisory.patched_versions,
  originPackages,
  package: advisory.module_name,
  paths,
  severity: advisory.severity,
  title: advisory.title,
  url: advisory.url,
  vulnerable: advisory.vulnerable_versions,
})

/**
 * Allowlist entries in scope that no longer match any advisory in the results —
 * candidates for removal. Non-fatal; surfaced as warnings so the list gets pruned.
 */
export const findStaleAllowlist = ({
  entries,
  hits,
  scope,
}: {
  entries: AllowlistEntry[]
  hits: AdvisoryHit[]
  scope: Scope
}): string[] => {
  const seen = new Set(hits.map((hit) => hit.advisory.github_advisory_id))
  const scopeKey = scope === 'monorepo' ? 'monorepo' : 'consumer'

  return entries
    .filter((entry) => entry.appliesTo === 'both' || entry.appliesTo === scopeKey)
    .filter((entry) => !seen.has(entry.advisory))
    .map((entry) => entry.advisory)
}

export const printReport = ({
  findings,
  jsonPath,
  packagesAudited,
  scope,
  severity,
}: {
  findings: ReportedFinding[]
  jsonPath: string
  packagesAudited: number
  scope: Scope
  severity: Severity
}): void => {
  const surface =
    scope === 'monorepo' ? 'the monorepo' : `${packagesAudited} consumer-facing packages`
  console.log(`Scope: ${scope} (${surface}) | severity: >= ${severity}`)

  if (findings.length === 0) {
    console.log('No actionable vulnerabilities')
    return
  }

  console.log('Actionable vulnerabilities found in the following packages:')
  for (const finding of findings) {
    const origin =
      finding.originPackages.length > 0 ? ` (via ${finding.originPackages.join(', ')})` : ''
    console.log(
      `${BOLD}${finding.package}${RESET} [${finding.severity}] vulnerable in ` +
        `${RED}${finding.vulnerable}${RESET} fixed in ` +
        `${GREEN}${finding.fixed_in}${RESET}${origin}`,
    )
    for (const bump of finding.bumps) {
      printBump({ bump, module: finding.package })
    }
  }

  console.log('')
  console.log(`Output written to ${jsonPath}`)
}

/** True when a resolution (relock or bump) is now available for this dependency. */
export const isResolvableBump = ({ fix }: Bump): boolean =>
  fix.status === 'fix' || fix.status === 'relock'

/**
 * Reviews allowlisted advisories that still appear: reports any whose vulnerability
 * a bump or relock can now clear, so the exception can be removed and the fix applied.
 */
export const printAllowlistReview = (findings: ReportedFinding[]): void => {
  const resolvable = findings.filter((finding) => finding.bumps.some(isResolvableBump))
  if (resolvable.length === 0) {
    return
  }

  console.log('')
  console.log('Allowlist review — these allowlisted advisories now have a resolution available:')
  for (const finding of resolvable) {
    console.log(`${BOLD}${finding.advisory}${RESET} (${finding.package}) — remove allowlist entry:`)
    for (const bump of finding.bumps.filter(isResolvableBump)) {
      printBump({ bump, module: finding.package })
    }
  }
}

/** Prints the remediation for one direct dependency: the minimal bump, relock, or why none applies. */
const printBump = ({
  bump: { currentSpec, dependency, fix, workspacePackages },
  module,
}: {
  bump: Bump
  module: string
}): void => {
  const where = workspacePackages.length > 0 ? ` (in ${workspacePackages.join(', ')})` : ''

  if (fix.status === 'unknown') {
    const cause =
      fix.reason === 'registry'
        ? 'registry unreachable'
        : 'current version unknown, declared outside packages/'
    console.log(`  ${dependency}: fix availability unknown — ${cause}${where}`)
    return
  }
  if (fix.status === 'none') {
    console.log(`  no bump of ${dependency} clears this yet -> allowlist or escalate${where}`)
    return
  }
  if (fix.status === 'relock') {
    const range = currentSpec ?? 'its current range'
    console.log(
      `  refresh lockfile: ${GREEN}pnpm update -r ${module}${RESET} — re-resolves ${module} to a ` +
        `patched version already permitted by ${dependency} ${range}${where}; no manifest edit needed`,
    )
    return
  }

  const from = currentSpec ? `from ${currentSpec} ` : ''
  console.log(`  bump ${dependency} ${from}to ${GREEN}>=${fix.version}${RESET}${where}`)
  if (fix.crossesMajor) {
    console.log(
      `    note: crosses major (${fix.fromMajor} -> ${fix.toMajor}), review for breaking changes`,
    )
  }
}

const compareFindings = (
  a: Pick<Finding, 'package' | 'severity'>,
  b: Pick<Finding, 'package' | 'severity'>,
): number => {
  const severityDelta = severityRank(b.severity) - severityRank(a.severity)
  if (severityDelta !== 0) {
    return severityDelta
  }
  return a.package.localeCompare(b.package)
}
