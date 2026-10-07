import fse from 'fs-extra'
import { fileURLToPath } from 'node:url'
import path from 'path'

import type { NextAppDetails, TanStackAppDetails } from '../types.js'

import { copyRecursiveSync } from '../utils/copy-recursive-sync.js'
import { info } from '../utils/log.js'
import { resolvePackageVersion } from '../utils/resolvePackageVersion.js'
import { getPackageManager } from './get-package-manager.js'
import { installPackages } from './install-packages.js'
import { TANSTACK_TEMPLATE_FILES } from './tanstack/template-files.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

type UpdateResult = { message: string; success: boolean }

type PackageUpdateResult = { isUpdated: boolean } & UpdateResult

export async function updatePayloadPackages({
  projectDir,
  versionOrTag,
}: {
  projectDir: string
  versionOrTag?: string
}): Promise<UpdateResult> {
  const result = await performPayloadPackageUpdate({ projectDir, versionOrTag })

  return { message: result.message, success: result.success }
}

export async function updatePayloadInNextProject({
  appDetails,
  versionOrTag,
}: {
  appDetails: NextAppDetails
  versionOrTag?: string
}): Promise<UpdateResult> {
  if (!appDetails.nextConfigPath) {
    return { message: 'No Next.js config found', success: false }
  }

  const projectDir = path.dirname(appDetails.nextConfigPath)
  const packageUpdate = await performPayloadPackageUpdate({ projectDir, versionOrTag })

  if (!packageUpdate.isUpdated) {
    return { message: packageUpdate.message, success: packageUpdate.success }
  }

  info(`Updating Payload Next.js files...`)

  const templateFilesPath =
    process.env.JEST_WORKER_ID !== undefined
      ? path.resolve(dirname, '../../../../templates/blank')
      : path.resolve(dirname, '../..', 'dist/template')

  const templateSrcDir = path.resolve(templateFilesPath, 'src/app/(payload)')
  const payloadDirPath = path.resolve(
    projectDir,
    appDetails.isSrcDir ? 'src/app' : 'app',
    '(payload)',
  )

  const legacyCustomStylesPath = path.resolve(payloadDirPath, 'custom.scss')
  const customCssPath = path.resolve(payloadDirPath, 'custom.css')

  if (fse.existsSync(legacyCustomStylesPath) && !fse.existsSync(customCssPath)) {
    fse.renameSync(legacyCustomStylesPath, customCssPath)
    info(
      'Renamed `(payload)/custom.scss` to `custom.css`. If it contained Sass syntax (nesting, `$variables`, `@mixin`, etc.), convert it to plain CSS — it is no longer transpiled.',
    )
  }

  copyRecursiveSync(templateSrcDir, payloadDirPath, ['custom.css$'])

  return { message: packageUpdate.message, success: packageUpdate.success }
}

export async function updatePayloadInTanStackProject({
  appDetails,
  templateRoot = resolveTanStackTemplateRoot(),
  versionOrTag,
}: {
  appDetails: TanStackAppDetails
  templateRoot?: string
  versionOrTag?: string
}): Promise<UpdateResult> {
  const packageUpdate = await performPayloadPackageUpdate({
    projectDir: appDetails.projectDir,
    versionOrTag,
  })

  if (!packageUpdate.isUpdated) {
    return { message: packageUpdate.message, success: packageUpdate.success }
  }

  info(`Updating Payload TanStack files...`)
  const hasPackedTemplateLayout = fse.existsSync(path.join(templateRoot, 'routes'))

  for (const { destination, relativePath, sourcePath } of TANSTACK_TEMPLATE_FILES) {
    const isPayloadRoute = destination === 'routes' && relativePath.startsWith('_payload')
    const isPayloadStyles = destination === 'src' && relativePath === 'payload.css'

    if (!isPayloadRoute && !isPayloadStyles) {
      continue
    }

    const destinationPath = path.join(
      destination === 'routes' ? appDetails.routesDir : appDetails.sourceDir,
      relativePath,
    )
    if (isPayloadStyles && fse.existsSync(destinationPath)) {
      continue
    }

    const templatePath = hasPackedTemplateLayout
      ? path.join(templateRoot, destination, relativePath)
      : path.join(templateRoot, sourcePath)
    fse.ensureDirSync(path.dirname(destinationPath))
    fse.copyFileSync(templatePath, destinationPath)
  }

  return { message: packageUpdate.message, success: packageUpdate.success }
}

export async function updatePayloadInProject(
  appDetails: NextAppDetails,
  versionOrTag?: string,
): Promise<UpdateResult> {
  return updatePayloadInNextProject({ appDetails, versionOrTag })
}

async function performPayloadPackageUpdate({
  projectDir,
  versionOrTag,
}: {
  projectDir: string
  versionOrTag?: string
}): Promise<PackageUpdateResult> {
  const packageObj = (await fse.readJson(path.resolve(projectDir, 'package.json'))) as {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
  }
  if (!packageObj.dependencies && !packageObj.devDependencies) {
    throw new Error('No package.json found in this project')
  }

  const dependencyGroups = [packageObj.dependencies, packageObj.devDependencies].filter(
    (dependencies): dependencies is Record<string, string> => Boolean(dependencies),
  )
  const payloadPackageEntries = dependencyGroups.flatMap((dependencies) =>
    Object.entries(dependencies).filter(
      ([packageName]) => packageName === 'payload' || packageName.startsWith('@payloadcms/'),
    ),
  )
  const payloadVersion = payloadPackageEntries.find(
    ([packageName]) => packageName === 'payload',
  )?.[1]
  if (!payloadVersion) {
    throw new Error('Payload is not installed in this project')
  }

  const packageManager = await getPackageManager({ projectDir })
  const latestPayloadVersion = await resolvePackageVersion({ packageName: 'payload', versionOrTag })

  if (payloadPackageEntries.every(([, version]) => version === latestPayloadVersion)) {
    return {
      isUpdated: false,
      message: `Payload v${payloadVersion} is already up to date.`,
      success: true,
    }
  }

  const payloadPackages = payloadPackageEntries
    .map(([packageName]) => packageName)
    .filter((packageName) => packageName.startsWith('@payloadcms/'))
  const packageNames = ['payload', ...new Set(payloadPackages)]
  const packagesToUpdate = packageNames.map(
    (packageName) => `${packageName}@${latestPayloadVersion}`,
  )

  info(`Using ${packageManager}.\n`)
  info(
    `Updating ${packagesToUpdate.length} Payload packages to v${latestPayloadVersion}...\n\n${packageNames.map((packageName) => `  - ${packageName}`).join('\n')}`,
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

  return { isUpdated: true, message: 'Payload updated successfully.', success: true }
}

function resolveTanStackTemplateRoot(): string {
  return path.basename(path.dirname(dirname)) === 'dist'
    ? path.resolve(dirname, '../template-tanstack')
    : path.resolve(dirname, '../../../../templates/blank-tanstack/src')
}
