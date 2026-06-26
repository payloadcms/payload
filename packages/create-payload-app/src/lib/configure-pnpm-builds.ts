import fse from 'fs-extra'
import path from 'path'

import type { PackageManager } from '../types.js'

// Build scripts pnpm v11 must be allowed to run for a Payload project; otherwise the install
// fails with ERR_PNPM_IGNORED_BUILDS.
const ALLOWED_BUILDS = ['esbuild', 'sharp', 'unrs-resolver']

/**
 * pnpm v11 fails installs that have unapproved dependency build scripts, reading approvals only from
 * pnpm-workspace.yaml (the `pnpm` field in package.json is ignored). create-next-app now scaffolds a
 * placeholder `allowBuilds` block (sharp/unrs-resolver left unset) plus an `ignoredBuiltDependencies`
 * denylist, so we must merge rather than skip: force Payload's build scripts to `true` and remove them
 * from the denylist. No-op for non-pnpm package managers.
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

  await fse.writeFile(workspacePath, upsertBuildApprovals(existing))
}

type WorkspaceBlock = {
  key: null | string
  lines: string[]
}

/**
 * Merges Payload's required build approvals into a pnpm-workspace.yaml string. Pure and idempotent:
 * sets each required package to `true` under `allowBuilds` (adding the block if missing) and strips
 * those packages from any `ignoredBuiltDependencies` denylist. Top-level keys are detected by a
 * zero-indent `key:`, with their two-space children grouped beneath them.
 */
export function upsertBuildApprovals(content: string): string {
  const blocks = toTopLevelBlocks(content)

  const ignored = blocks.find((block) => block.key === 'ignoredBuiltDependencies')
  if (ignored) {
    ignored.lines = ignored.lines.filter((line, index) => {
      if (index === 0) {
        return true
      }
      const name = /^\s*-\s*'?([^'\s]+)'?\s*$/.exec(line)?.[1]
      return !(name && ALLOWED_BUILDS.includes(name))
    })
  }

  const allow = blocks.find((block) => block.key === 'allowBuilds')
  if (allow) {
    for (const name of ALLOWED_BUILDS) {
      const pattern = new RegExp(`^\\s+'?${escapeRegExp(name)}'?:`)
      const index = allow.lines.findIndex((line) => pattern.test(line))
      if (index >= 0) {
        allow.lines[index] = `  ${name}: true`
      } else {
        allow.lines.push(`  ${name}: true`)
      }
    }
  } else {
    blocks.push({
      key: 'allowBuilds',
      lines: ['allowBuilds:', ...ALLOWED_BUILDS.map((name) => `  ${name}: true`)],
    })
  }

  const output = blocks.flatMap((block) => block.lines).join('\n')
  return output.endsWith('\n') ? output : `${output}\n`
}

function toTopLevelBlocks(content: string): WorkspaceBlock[] {
  const lines = content.length ? content.replace(/\n$/, '').split('\n') : []
  const blocks: WorkspaceBlock[] = []

  for (const line of lines) {
    const key = /^[^\s#]/.test(line) ? /^([^:]+):/.exec(line)?.[1] : undefined
    const current = blocks[blocks.length - 1]
    if (key !== undefined) {
      blocks.push({ key, lines: [line] })
    } else if (current) {
      current.lines.push(line)
    } else {
      blocks.push({ key: null, lines: [line] })
    }
  }

  return blocks
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
