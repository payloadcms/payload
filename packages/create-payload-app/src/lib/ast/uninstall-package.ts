import { spawn } from 'node:child_process'

import type { PackageManager } from '../../types.js'

import { debug } from '../../utils/log.js'

/**
 * Uninstall a package using the project's package manager
 * Does not throw on failure - orphaned package is better than broken config
 */
export async function uninstallPackage(
  projectPath: string,
  packageName: string,
  packageManager: PackageManager,
): Promise<void> {
  return new Promise((resolve) => {
    const command = packageManager
    const args = ['remove', packageName]

    // npm uses 'uninstall' instead of 'remove'
    if (packageManager === 'npm') {
      args[0] = 'uninstall'
    }

    debug(`[AST] Running: ${command} ${args.join(' ')} in ${projectPath}`)

    const child = spawn(command, args, {
      cwd: projectPath,
      shell: true,
      stdio: 'pipe',
    })

    child.on('close', (code) => {
      if (code === 0) {
        debug(`[AST] ✓ Successfully uninstalled ${packageName}`)
      } else {
        debug(`[AST] Failed to uninstall ${packageName} (exit code: ${code}), continuing anyway`)
      }
      // Always resolve, even on error
      resolve()
    })

    child.on('error', (error) => {
      debug(`[AST] Spawn error for ${command}: ${error.message}, continuing anyway`)
      resolve()
    })
  })
}
