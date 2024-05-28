// @ts-expect-error no types
import { detect } from 'detect-package-manager'

import type { CliArgs, PackageManager } from '../types.js'

export async function getPackageManager(args: {
  cliArgs?: CliArgs
  projectDir: string
}): Promise<PackageManager> {
  const { cliArgs, projectDir } = args

  if (!cliArgs) {
    const detected = await detect({ cwd: projectDir })
    return detected || 'npm'
  }

  let packageManager: PackageManager = 'npm'

  if (cliArgs['--use-npm']) {
    packageManager = 'npm'
  } else if (cliArgs['--use-yarn']) {
    packageManager = 'yarn'
  } else if (cliArgs['--use-pnpm']) {
    packageManager = 'pnpm'
  } else {
    const detected = await detect({ cwd: projectDir })
    packageManager = detected || 'npm'
  }
  return packageManager
}
