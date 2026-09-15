import type { AllowlistEntry } from './allowlist'
import type { AdvisoryHit, Finding, Scope, Severity } from '../types'

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
    .map(({ advisory, originPackages }) => ({
      advisory: advisory.github_advisory_id,
      fixed_in: advisory.patched_versions,
      originPackages,
      package: advisory.module_name,
      severity: advisory.severity,
      title: advisory.title,
      url: advisory.url,
      vulnerable: advisory.vulnerable_versions,
    }))
    .sort(compareFindings)
}

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
  findings: Finding[]
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
  }

  console.log('')
  console.log(`Output written to ${jsonPath}`)
}

const compareFindings = (a: Finding, b: Finding): number => {
  const severityDelta = severityRank(b.severity) - severityRank(a.severity)
  if (severityDelta !== 0) {
    return severityDelta
  }
  return a.package.localeCompare(b.package)
}
