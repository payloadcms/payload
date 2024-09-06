import fse from 'fs-extra'

import type { CliArgs, PackageManager } from '../types.js'

export function getPackageManager(args: { cliArgs?: CliArgs; projectDir: string }): PackageManager {
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
    } else {
      // Otherwise check the execution environment
      detected = getEnvironmentPackageManager()
    }

    return detected
  } catch (ignore) {
    return 'npm'
  }
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
