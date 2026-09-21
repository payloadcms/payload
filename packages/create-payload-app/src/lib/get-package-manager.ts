import execa from 'execa'
import fse from 'fs-extra'

import type { CliArgs, PackageManager } from '../types.js'

export async function getPackageManager(args: {
  cliArgs?: CliArgs
  projectDir: string
}): Promise<PackageManager> {
  const { cliArgs, projectDir } = args

  try {
    // Check for flag or lockfile
    let detected: PackageManager = 'npm'
    if (cliArgs?.['--use-pnpm'] || fse.existsSync(`${projectDir}/pnpm-lock.yaml`)) {
      detected = 'pnpm'
    } else if (cliArgs?.['--use-yarn'] || fse.existsSync(`${projectDir}/yarn.lock`)) {
      detected = 'yarn'
    } else if (cliArgs?.['--use-npm'] || fse.existsSync(`${projectDir}/package-lock.json`)) {
      detected = 'npm'
    } else if (cliArgs?.['--use-bun'] || fse.existsSync(`${projectDir}/bun.lockb`)) {
      detected = 'bun'
    } else if (await commandExists('pnpm')) {
      // Prefer pnpm if it's installed
      detected = 'pnpm'
    } else {
      // Otherwise check the execution environment
      detected = getEnvironmentPackageManager()
    }

    return detected
  } catch (ignore) {
    return 'npm'
  }
}

/**
 * The command that installs every dependency listed in package.json.
 */
export function getInstallCommand(packageManager: PackageManager): string {
  if (packageManager === 'yarn') {
    return 'yarn'
  }
  if (packageManager === 'pnpm') {
    return 'pnpm install'
  }
  if (packageManager === 'bun') {
    return 'bun install'
  }
  return 'npm install --legacy-peer-deps'
}

/**
 * The prefix that runs a package.json script. npm needs `npm run <script>`, while
 * pnpm, yarn, and bun run scripts directly.
 */
export function getRunCommand(packageManager: PackageManager): string {
  return packageManager === 'npm' ? 'npm run' : packageManager
}

function getEnvironmentPackageManager(): PackageManager {
  const userAgent = process.env.npm_config_user_agent || ''

  if (userAgent.startsWith('yarn')) {
    return 'yarn'
  }

  if (userAgent.startsWith('pnpm')) {
    return 'pnpm'
  }

  if (userAgent.startsWith('bun')) {
    return 'bun'
  }

  return 'npm'
}

async function commandExists(command: string): Promise<boolean> {
  try {
    await execa.command(process.platform === 'win32' ? `where ${command}` : `command -v ${command}`)
    return true
  } catch {
    return false
  }
}
