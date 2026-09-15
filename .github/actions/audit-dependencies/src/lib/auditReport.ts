import type { AdvisoryHit, PnpmAdvisory, PnpmAuditReport } from '../types'

/**
 * Parses `pnpm audit --json` stdout. Tolerant by design: registry errors (run
 * with `--ignore-registry-errors`) or empty output yield an empty report rather
 * than throwing, so a transient registry hiccup never fails the gate.
 */
export const parseAuditReport = (stdout: string): PnpmAuditReport => {
  let data: unknown
  try {
    data = JSON.parse(stdout)
  } catch {
    return { advisories: {} }
  }

  if (!isRecord(data) || !isRecord(data.advisories)) {
    return { advisories: {} }
  }

  const advisories: Record<string, PnpmAdvisory> = {}
  for (const [key, value] of Object.entries(data.advisories)) {
    const advisory = toAdvisory(value)
    if (advisory) {
      advisories[key] = advisory
    }
  }
  return { advisories }
}

/** Turns an audit report into hits tagged with the originating package. */
export const toHits = ({
  report,
  originPackage,
}: {
  originPackage: string | null
  report: PnpmAuditReport
}): AdvisoryHit[] =>
  Object.values(report.advisories).map((advisory) => ({
    advisory,
    originPackages: originPackage === null ? [] : [originPackage],
  }))

/** Dedupes hits by GHSA, unioning and sorting their origin packages. */
export const mergeHits = (hits: AdvisoryHit[]): AdvisoryHit[] => {
  const byGhsa = new Map<string, AdvisoryHit>()

  for (const hit of hits) {
    const key = hit.advisory.github_advisory_id
    const existing = byGhsa.get(key)
    if (!existing) {
      byGhsa.set(key, { advisory: hit.advisory, originPackages: [...hit.originPackages] })
      continue
    }
    for (const origin of hit.originPackages) {
      if (!existing.originPackages.includes(origin)) {
        existing.originPackages.push(origin)
      }
    }
  }

  for (const hit of byGhsa.values()) {
    hit.originPackages.sort()
  }
  return [...byGhsa.values()]
}

const toAdvisory = (value: unknown): null | PnpmAdvisory => {
  if (
    !isRecord(value) ||
    typeof value.github_advisory_id !== 'string' ||
    typeof value.module_name !== 'string' ||
    typeof value.severity !== 'string' ||
    typeof value.patched_versions !== 'string' ||
    typeof value.vulnerable_versions !== 'string'
  ) {
    return null
  }

  return {
    findings: Array.isArray(value.findings) ? value.findings : [],
    github_advisory_id: value.github_advisory_id,
    id: typeof value.id === 'number' ? value.id : 0,
    module_name: value.module_name,
    patched_versions: value.patched_versions,
    severity: value.severity,
    title: typeof value.title === 'string' ? value.title : '',
    url: typeof value.url === 'string' ? value.url : '',
    vulnerable_versions: value.vulnerable_versions,
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null
