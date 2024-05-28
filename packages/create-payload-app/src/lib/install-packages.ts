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
  let stdout = ''
  let stderr = ''

  switch (packageManager) {
    case 'npm': {
      ;({ exitCode, stderr, stdout } = await execa(
        'npm',
        ['install', '--save', ...packagesToInstall],
        {
          cwd: projectDir,
        },
      ))
      break
    }
    case 'yarn':
    case 'pnpm': {
      ;({ exitCode, stderr, stdout } = await execa(packageManager, ['add', ...packagesToInstall], {
        cwd: projectDir,
      }))
      break
    }
    case 'bun': {
      warning('Bun support is untested.')
      ;({ exitCode, stderr, stdout } = await execa('bun', ['add', ...packagesToInstall], {
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
