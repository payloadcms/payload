/** Minimal shape of an npm registry packument we read. */
export type RegistryPackument = {
  'dist-tags'?: Record<string, string>
  versions?: Record<
    string,
    {
      engines?: Record<string, string>
      peerDependencies?: Record<string, string>
    }
  >
}

export type FetchRegistry = (packageName: string) => Promise<RegistryPackument>

export type Spawn = (
  command: string,
  args: string[],
  options: { cwd: string; env: NodeJS.ProcessEnv },
) => Promise<{ code: number }>

export type PackageManager = 'bun' | 'npm' | 'pnpm' | 'yarn'

/** Target versions the command resolves. Only some are written; see `written`. */
export type ResolvedVersions = {
  /** Copied verbatim into engines.node. */
  enginesNode: string
  /** Newest patch within @payloadcms/next's peer range. REPORT ONLY, never written. */
  nextTarget: null | string
  /** Exact canary, applied in lockstep to payload + every @payloadcms/*. */
  payloadVersion: string
  /** TypeScript floor (guide-sourced constant). */
  typescript: string
  /** Newest @types/node patch within the Node major. */
  typesNode: string
}

export type UpgradeDeps = {
  exists: (path: string) => boolean
  fetchRegistry: FetchRegistry
  spawn: Spawn
}

/**
 * TypeScript floor for Payload v4. Nothing machine-readable declares it, so it
 * lives here, sourced from the v4 migration guide prose. Bump alongside the guide.
 */
export const TS_FLOOR = '6.0.3'

/** Path (relative to dist/) of the bundled runbook the command points users to. */
export const RUNBOOK_RELATIVE_PATH = 'runbook/payload-v4-upgrade.md'
