// @ts-expect-error no types
import { detect } from 'detect-package-manager'
import execa from 'execa'
import fse from 'fs-extra'
import { fileURLToPath } from 'node:url'
import path from 'path'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

import type { NextAppDetails } from '../types.js'

import { copyRecursiveSync } from '../utils/copy-recursive-sync.js'
import { debug, info, warning } from '../utils/log.js'

export async function updatePayloadInProject(
  appDetails: NextAppDetails,
): Promise<{ success: boolean }> {
  if (!appDetails.nextConfigPath) return { success: false }

  const projectDir = path.dirname(appDetails.nextConfigPath)

  const packageObj = (await fse.readJson(path.resolve(projectDir, 'package.json'))) as {
    dependencies?: Record<string, string>
  }
  if (!packageObj?.dependencies) {
    throw new Error('No package.json found in this project')
  }

  const payloadVersion = packageObj.dependencies?.payload
  if (!payloadVersion) {
    throw new Error('Payload is not installed in this project')
  }

  const packageManager = await detect({ cwd: projectDir })

  // Fetch latest Payload version from npm
  const { exitCode: getLatestVersionExitCode, stdout: latestPayloadVersion } = await execa('npm', [
    'show',
    'payload@beta',
    'version',
  ])
  if (getLatestVersionExitCode !== 0) {
    throw new Error('Failed to fetch latest Payload version')
  }

  if (payloadVersion === latestPayloadVersion) {
    throw new Error(`Payload v${payloadVersion} is already up to date.`)
  }

  // Update all existing Payload packages
  const payloadPackages = Object.keys(packageObj.dependencies).filter((dep) =>
    dep.startsWith('@payloadcms/'),
  )
  const packagesToUpdate = ['payload', ...payloadPackages].map(
    (pkg) => `${pkg}@${latestPayloadVersion}`,
  )

  info(`Updating ${packagesToUpdate.length} Payload packages to v${latestPayloadVersion}...`)
  debug(`Packages to update: ${packagesToUpdate.join(', ')}`)
  debug(`Package Manager: ${packageManager}`)
  debug(`Project directory: ${projectDir}`)

  // Update all packages
  let exitCode = 0
  let stdout = ''
  let stderr = ''
  switch (packageManager) {
    case 'npm': {
      ;({ exitCode, stderr, stdout } = await execa(
        'npm',
        ['install', '--save', ...packagesToUpdate],
        {
          cwd: projectDir,
        },
      ))
      break
    }
    case 'yarn':
    case 'pnpm': {
      debug(`args: ${[packageManager, 'add', ...packagesToUpdate].join(' ')}`)
      ;({ exitCode, stderr, stdout } = await execa(packageManager, ['add', ...packagesToUpdate], {
        cwd: projectDir,
      }))
      break
    }
    case 'bun': {
      warning('Bun support is untested.')
      ;({ exitCode } = await execa('bun', ['add', ...packagesToUpdate], { cwd: projectDir }))
      break
    }
  }
  debug(`Exit code: ${exitCode}`)
  debug(`stdout: ${stdout}`)
  debug(`stderr: ${stderr}`)

  if (exitCode !== 0) {
    throw new Error('Failed to update Payload packages')
  }
  info('Payload packages updated successfully.')

  info(`Updating Payload Next.js files...`)
  const templateFilesPath = dirname.endsWith('dist')
    ? path.resolve(dirname, '../..', 'dist/template')
    : path.resolve(dirname, '../../../../templates/blank-3.0')

  const templateSrcDir = path.resolve(templateFilesPath ? '' : 'src')

  copyRecursiveSync(templateSrcDir, path.dirname(dirname))

  return { success: true }
}
