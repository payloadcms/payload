import execa from 'execa'
import fse from 'fs-extra'
import { fileURLToPath } from 'node:url'
import path from 'path'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

import type { NextAppDetails } from '../types.js'

import { copyRecursiveSync } from '../utils/copy-recursive-sync.js'
import { info } from '../utils/log.js'
import { getPackageManager } from './get-package-manager.js'
import { installPackages } from './install-packages.js'

export async function updatePayloadInProject(
  appDetails: NextAppDetails,
): Promise<{ message: string; success: boolean }> {
  if (!appDetails.nextConfigPath) {
    return { message: 'No Next.js config found', success: false }
  }

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

  const packageManager = await getPackageManager({ projectDir })

  // Fetch latest Payload version from npm
  const { exitCode: getLatestVersionExitCode, stdout: latestPayloadVersion } = await execa('npm', [
    'show',
    'payload',
    'version',
  ])
  if (getLatestVersionExitCode !== 0) {
    throw new Error('Failed to fetch latest Payload version')
  }

  if (payloadVersion === latestPayloadVersion) {
    return { message: `Payload v${payloadVersion} is already up to date.`, success: true }
  }

  // Update all existing Payload packages
  const payloadPackages = Object.keys(packageObj.dependencies).filter((dep) =>
    dep.startsWith('@payloadcms/'),
  )

  const packageNames = ['payload', ...payloadPackages]

  const packagesToUpdate = packageNames.map((pkg) => `${pkg}@${latestPayloadVersion}`)

  info(`Using ${packageManager}.\n`)
  info(
    `Updating ${packagesToUpdate.length} Payload packages to v${latestPayloadVersion}...\n\n${packageNames.map((p) => `  - ${p}`).join('\n')}`,
  )

  const { success: updateSuccess } = await installPackages({
    packageManager,
    packagesToInstall: packagesToUpdate,
    projectDir,
  })

  if (!updateSuccess) {
    throw new Error('Failed to update Payload packages')
  }
  info('Payload packages updated successfully.')

  info(`Updating Payload Next.js files...`)

  const templateFilesPath =
    process.env.JEST_WORKER_ID !== undefined
      ? path.resolve(dirname, '../../../../templates/blank')
      : path.resolve(dirname, '../..', 'dist/template')

  const templateSrcDir = path.resolve(templateFilesPath, 'src/app/(payload)')

  copyRecursiveSync(
    templateSrcDir,
    path.resolve(projectDir, appDetails.isSrcDir ? 'src/app' : 'app', '(payload)'),
    ['custom.scss$'], // Do not overwrite user's custom.scss
  )

  return { message: 'Payload updated successfully.', success: true }
}
