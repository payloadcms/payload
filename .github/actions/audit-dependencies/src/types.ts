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

/** A direct dependency we declare that pulls in a vulnerable module — the thing to bump. */
export type DirectDependency = {
  /** The direct dependency to bump, e.g. `@typescript-eslint/parser`. */
  dependency: string
  /** The workspace package whose manifest declares it, e.g. `eslint-config`; null when unknown. */
  workspacePackage: null | string
}

/** An advisory tagged with the consumer-facing packages whose graph surfaced it. */
export type AdvisoryHit = {
  advisory: PnpmAdvisory
  /** Direct dependencies we declare that introduce the vulnerable module — the remediation targets. */
  directDeps: DirectDependency[]
  /** Empty for monorepo scope; short names (e.g. `payload`, `ui`) for consumer-facing. */
  originPackages: string[]
  /** Human-readable dependency chains that introduce the vulnerable module, e.g. `ui > @monaco-editor/react > monaco-editor`. */
  paths: string[]
}

/** A reported, actionable vulnerability written to the JSON output and console. */
export type Finding = {
  advisory: string
  /** Direct dependencies to bump to remediate, grouped by owning workspace package. */
  directDeps: DirectDependency[]
  fixed_in: string
  originPackages: string[]
  package: string
  /** Dependency chains that introduce the vulnerable module. */
  paths: string[]
  severity: string
  title: string
  url: string
  vulnerable: string
}
