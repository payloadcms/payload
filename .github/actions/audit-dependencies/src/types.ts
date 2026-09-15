export type Scope = 'consumer-facing' | 'monorepo'

export type Severity = 'critical' | 'high' | 'low' | 'moderate'

/** A single advisory as emitted under `.advisories` by `pnpm audit --json`. */
export type PnpmAdvisory = {
  findings: Array<{ paths: string[]; version: string }>
  github_advisory_id: string
  id: number
  module_name: string
  /** `<0.0.0` means no fix exists yet (unactionable). */
  patched_versions: string
  severity: string
  title: string
  url: string
  vulnerable_versions: string
}

export type PnpmAuditReport = {
  advisories: Record<string, PnpmAdvisory>
}

/** An advisory tagged with the consumer-facing packages whose graph surfaced it. */
export type AdvisoryHit = {
  advisory: PnpmAdvisory
  /** Empty for monorepo scope; short names (e.g. `payload`, `ui`) for consumer-facing. */
  originPackages: string[]
}

/** A reported, actionable vulnerability written to the JSON output and console. */
export type Finding = {
  advisory: string
  fixed_in: string
  originPackages: string[]
  package: string
  severity: string
  title: string
  url: string
  vulnerable: string
}
