// @ts-expect-error no types
import { detect } from 'detect-package-manager'

import type { CliArgs, PackageManager } from '../types.js'

export async function getPackageManager(
  args: CliArgs,
  projectDir: string,
): Promise<PackageManager> {
  let packageManager: PackageManager = 'npm'

  if (args['--use-npm']) {
    packageManager = 'npm'
  } else if (args['--use-yarn']) {
    packageManager = 'yarn'
  } else if (args['--use-pnpm']) {
    packageManager = 'pnpm'
  } else {
    const detected = await detect({ cwd: projectDir })
    packageManager = detected || 'npm'
  }
  return packageManager
}
