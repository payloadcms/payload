import execa from 'execa'

import type { PackageManager } from '../types.js'

import { error, warning } from '../utils/log.js'

export async function installPackages(args: {
  packageManager: PackageManager
  packagesToInstall: string[]
  projectDir: string
}) {
  const { packageManager, packagesToInstall, projectDir } = args

  let exitCode = 0
  let stderr = ''

  switch (packageManager) {
    case 'bun':
    case 'pnpm':
    case 'yarn': {
      if (packageManager === 'bun') {
        warning('Bun support is untested.')
      }
      ;({ exitCode, stderr } = await execa(packageManager, ['add', ...packagesToInstall], {
        cwd: projectDir,
      }))
      break
    }
    case 'npm': {
      ;({ exitCode, stderr } = await execa('npm', ['install', '--save', ...packagesToInstall], {
        cwd: projectDir,
      }))
      break
    }
  }

  if (exitCode !== 0) {
    error(`Unable to install packages. Error: ${stderr}`)
  }

  return { success: exitCode === 0 }
}
