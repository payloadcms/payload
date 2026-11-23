import type { FetchRegistry, RegistryPackage } from '../upgrade-shared/index.js'

export type RegistryPackument = RegistryPackage
export type { FetchRegistry }

export type Spawn = (
  command: string,
  args: string[],
  options: { cwd: string; env: NodeJS.ProcessEnv },
) => Promise<{ code: number }>

export type PackageManager = 'bun' | 'npm' | 'pnpm' | 'yarn'

export type { ResolvedVersions } from '../upgrade-shared/toolchain.js'

export type UpgradeDeps = {
  exists: (path: string) => boolean
  fetchRegistry: FetchRegistry
  spawn: Spawn
}

export { TS_FLOOR } from '../upgrade-shared/toolchain.js'

/** Path (relative to dist/) of the bundled runbook the command points users to. */
export const RUNBOOK_RELATIVE_PATH = 'runbook/payload-v4-upgrade.md'

/**
 * Path (relative to dist/) of the bundled migration guide. Present only when the
 * monorepo copy was available at build time; the report points at it when it exists.
 */
export const MIGRATION_GUIDE_RELATIVE_PATH = 'runbook/v4.mdx'
