import type { PackageManager, Spawn } from './types.js'

type RunInstallArgs = {
  packageManager: PackageManager
  path: string
  spawn: Spawn
}

/**
 * Install dependencies with the detected package manager. `install` is the same
 * subcommand across pnpm/npm/yarn/bun. Corepack's interactive download prompt is
 * disabled so a non-interactive run cannot hang and abort the install.
 */
export function runInstall({
  packageManager,
  path,
  spawn,
}: RunInstallArgs): Promise<{ code: number }> {
  return spawn(packageManager, ['install'], {
    cwd: path,
    env: { ...process.env, COREPACK_ENABLE_DOWNLOAD_PROMPT: '0' },
  })
}
