import { existsSync } from 'node:fs'
import { join } from 'node:path'

import type { PackageManager } from './types.js'

const LOCKFILES: { file: string; pm: PackageManager }[] = [
  { file: 'pnpm-lock.yaml', pm: 'pnpm' },
  { file: 'yarn.lock', pm: 'yarn' },
  { file: 'bun.lockb', pm: 'bun' },
  { file: 'bun.lock', pm: 'bun' },
  { file: 'package-lock.json', pm: 'npm' },
]

/**
 * Map a project directory's lockfile to its package manager. `exists` is
 * injectable so callers can test offline; it defaults to the real filesystem.
 * pnpm is checked first, so it wins in a multi-lockfile repo.
 */
export function detectPackageManager(
  projectPath: string,
  exists: (path: string) => boolean = existsSync,
): PackageManager {
  for (const { file, pm } of LOCKFILES) {
    if (exists(join(projectPath, file))) {
      return pm
    }
  }
  return 'npm'
}
