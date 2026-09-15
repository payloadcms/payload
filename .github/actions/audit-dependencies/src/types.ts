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
  /** Every package name on the introducing chains (intermediates + the vulnerable module), for metadata tracing. */
  chainPackages: string[]
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
  /** Every package name on the introducing chains, for metadata tracing. */
  chainPackages: string[]
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

/** The outcome of tracing whether bumping a direct dependency can clear the vulnerability. */
export type FixResult =
  | {
      /** The bump crosses the current major, so it may carry breaking changes. */
      crossesMajor: boolean
      fromMajor: null | number
      status: 'fix'
      toMajor: number
      /** The minimal version of the direct dependency whose metadata resolves the module into its patched range. */
      version: string
    }
  | {
      /** The declared range already permits a patched resolution; only the lockfile is stale. */
      status: 'relock'
      version: string
    }
  | { status: 'none' }
  | {
      /** `registry`: a packument was unreachable. `no-current-version`: the owner's declared version is unknown (e.g. declared outside packages/), so a safe minimal bump cannot be computed. */
      reason: 'no-current-version' | 'registry'
      status: 'unknown'
    }

/** A remediation suggestion for one direct dependency, grouped across the packages that declare it. */
export type Bump = {
  /** The resolved version range we currently declare (catalog-resolved); null when unknown/mixed. */
  currentSpec: null | string
  dependency: string
  fix: FixResult
  workspacePackages: string[]
}

/** A finding enriched with per-direct-dependency bump suggestions for reporting. */
export type ReportedFinding = Omit<Finding, 'directDeps'> & { bumps: Bump[] }

/**
 * A single machine-applicable remediation step. An agent can turn each into a
 * concrete change: `relock` runs a command, `bump` edits manifests, `manual`
 * needs a human decision (no fix, or the fix could not be determined).
 */
export type PlanAction =
  | {
      /** True when the target range crosses the current major — flag for breaking-change review. */
      crossesMajor: boolean
      dependency: string
      /** package.json files to edit, e.g. `packages/ui/package.json`. */
      manifests: string[]
      /** The minimal range to declare, e.g. `>=7.29.0`. */
      toRange: string
      type: 'bump'
    }
  | {
      /** Shell command that refreshes the lockfile so the already-permitted patched version resolves. */
      command: string
      /** The vulnerable module whose resolution is stale. */
      module: string
      type: 'relock'
    }
  | {
      advisory: string
      dependency: string
      module: string
      /** Why this cannot be auto-remediated: no fix exists, or the fix could not be determined. */
      reason: string
      type: 'manual'
    }

/** A machine-readable remediation plan an agent can apply then re-verify. */
export type Plan = {
  actions: PlanAction[]
  scope: Scope
  /** Command to re-run the audit after applying the actions. */
  verify: string
}
