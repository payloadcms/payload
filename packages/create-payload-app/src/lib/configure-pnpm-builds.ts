import fse from 'fs-extra'
import path from 'path'

import type { PackageManager } from '../types.js'

// Build scripts pnpm v11 must be allowed to run for a Payload project; otherwise the install
// fails with ERR_PNPM_IGNORED_BUILDS.
const ALLOWED_BUILDS = ['esbuild', 'sharp', 'unrs-resolver']

/**
 * pnpm v11 fails installs that have unapproved dependency build scripts, and reads build approvals
 * only from pnpm-workspace.yaml (the `pnpm` field in package.json is ignored). Ensure the project
 * declares an `allowBuilds` block so the install runs the scripts Payload needs and future installs
 * succeed. No-op for other package managers or when the project already manages `allowBuilds`.
 */
export async function ensurePnpmBuildApprovals(args: {
  packageManager: PackageManager
  projectDir: string
}): Promise<void> {
  const { packageManager, projectDir } = args
  if (packageManager !== 'pnpm') {
    return
  }

  const workspacePath = path.join(projectDir, 'pnpm-workspace.yaml')
  const existing = (await fse.pathExists(workspacePath))
    ? await fse.readFile(workspacePath, 'utf-8')
    : ''

  if (existing.includes('allowBuilds:')) {
    return
  }

  const block = `allowBuilds:\n${ALLOWED_BUILDS.map((name) => `  ${name}: true`).join('\n')}\n`
  const content =
    existing && !existing.endsWith('\n') ? `${existing}\n${block}` : `${existing}${block}`
  await fse.writeFile(workspacePath, content)
}
