import execa from 'execa'
import fse from 'fs-extra'
import { fileURLToPath } from 'node:url'
import path from 'path'
import semver from 'semver'
import { Project } from 'ts-morph'

import type { CliArgs, NextAppDetails, TanStackAppDetails } from '../types.js'
import type { UpgradePlan } from '../upgrade-shared/index.js'

import {
  applyUpgradePlan,
  createRegistryClient,
  createUpgradePlan,
  readInstalledVersion,
  readProject,
  resolveTargets,
} from '../upgrade-shared/index.js'
import { payloadPackageNames } from '../upgrade-shared/payload-package-names.js'
import { copyRecursiveSync } from '../utils/copy-recursive-sync.js'
import { info } from '../utils/log.js'
import { DEFAULT_PAYLOAD_VERSION_TAG } from '../utils/resolvePackageVersion.js'
import { getAdminRoute } from './get-admin-route.js'
import { getPackageManager } from './get-package-manager.js'
import { TANSTACK_TEMPLATE_FILES } from './tanstack/template-files.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

type UpdateResult = { message: string; success: boolean }

type PackageUpdateResult = { isUpdated: boolean; targetVersion: string } & UpdateResult

export async function updatePayloadPackages({
  cliArgs,
  plan,
  projectDir,
  versionOrTag,
}: {
  cliArgs?: CliArgs
  plan?: UpgradePlan
  projectDir: string
  versionOrTag?: string
}): Promise<UpdateResult> {
  const result = await performPayloadPackageUpdate({ cliArgs, plan, projectDir, versionOrTag })

  return { message: result.message, success: result.success }
}

/**
 * Upgrade Payload packages and refresh Next.js wrappers at the configured admin route.
 * Validate the route only when an upgrade is needed, before installing packages.
 */
export async function updatePayloadInNextProject({
  appDetails,
  cliArgs,
  plan,
  versionOrTag,
}: {
  appDetails: NextAppDetails
  cliArgs?: CliArgs
  plan?: UpgradePlan
  versionOrTag?: string
}): Promise<UpdateResult> {
  if (!appDetails.nextConfigPath) {
    return { message: 'No Next.js config found', success: false }
  }

  const projectDir = path.dirname(appDetails.nextConfigPath)
  let adminRoute = '/admin'
  const packageUpdate = await performPayloadPackageUpdate({
    beforeInstall: () => {
      adminRoute = getAdminRoute({ projectDir })
    },
    cliArgs,
    plan,
    projectDir,
    versionOrTag,
  })

  if (!packageUpdate.isUpdated || !canRefreshWrappers({ version: packageUpdate.targetVersion })) {
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

  if (adminRoute === '/admin') {
    copyRecursiveSync(templateSrcDir, payloadDirPath, ['custom.css$'])
  } else {
    // Next.js uses %5F for routable segments that begin with an underscore.
    const adminFolder = adminRoute
      .slice(1)
      .split('/')
      .map((segment) => segment.replace(/^_/, '%5F'))
      .join('/')

    copyRecursiveSync(templateSrcDir, payloadDirPath, ['custom.css$', '^admin$'])
    copyRecursiveSync(path.join(templateSrcDir, 'admin'), path.join(payloadDirPath, adminFolder))

    const layout = new Project().addSourceFileAtPath(path.join(payloadDirPath, 'layout.tsx'))
    const importMapPath = adminFolder ? `./${adminFolder}/importMap.js` : './importMap.js'

    layout.getImportDeclaration('./admin/importMap.js')?.setModuleSpecifier(importMapPath)
    layout.saveSync()
  }

  return { message: packageUpdate.message, success: packageUpdate.success }
}

export async function updatePayloadInTanStackProject({
  appDetails,
  cliArgs,
  plan,
  templateRoot = resolveTanStackTemplateRoot(),
  versionOrTag,
}: {
  appDetails: TanStackAppDetails
  cliArgs?: CliArgs
  plan?: UpgradePlan
  templateRoot?: string
  versionOrTag?: string
}): Promise<UpdateResult> {
  const packageUpdate = await performPayloadPackageUpdate({
    cliArgs,
    plan,
    projectDir: appDetails.projectDir,
    versionOrTag,
  })

  if (!packageUpdate.isUpdated || !canRefreshWrappers({ version: packageUpdate.targetVersion })) {
    return { message: packageUpdate.message, success: packageUpdate.success }
  }

  info(`Updating Payload TanStack files...`)
  const hasPackedTemplateLayout = fse.existsSync(path.join(templateRoot, 'routes'))

  for (const { destination, relativePath, sourcePath } of TANSTACK_TEMPLATE_FILES) {
    const isPayloadRoute = destination === 'routes' && relativePath.startsWith('_payload')
    const isCustomStyles = destination === 'routes' && relativePath === '_payload/custom.css'

    if (!isPayloadRoute) {
      continue
    }

    const destinationPath = path.join(
      destination === 'routes' ? appDetails.routesDir : appDetails.sourceDir,
      relativePath,
    )
    if (isCustomStyles && fse.existsSync(destinationPath)) {
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

/** Apply a reviewed same-major plan without changing dependency groups. */
async function performPayloadPackageUpdate({
  beforeInstall,
  cliArgs,
  plan: preparedPlan,
  projectDir,
  versionOrTag,
}: {
  beforeInstall?: () => void
  cliArgs?: CliArgs
  plan?: UpgradePlan
  projectDir: string
  versionOrTag?: string
}): Promise<PackageUpdateResult> {
  const project = preparedPlan?.project ?? readProject({ projectDir })
  if (project.projectDir !== path.resolve(projectDir)) {
    throw new Error('The upgrade plan belongs to a different project.')
  }
  const fetchRegistry = createRegistryClient({ projectDir })
  const target =
    preparedPlan?.targetVersion ??
    (
      await resolveTargets({
        defaultTag: DEFAULT_PAYLOAD_VERSION_TAG,
        explicitTarget: versionOrTag,
        fetchRegistry,
        project,
      })
    )[0]?.version
  if (!target) {
    throw new Error('No Payload update target found.')
  }
  const plan =
    preparedPlan ??
    (await createUpgradePlan({
      corePackageNames: payloadPackageNames,
      fetchRegistry,
      project,
      targetVersion: target,
    }))
  if (plan.blockers.length) {
    throw new Error(plan.blockers.join('\n'))
  }
  if (plan.kind === 'migrate') {
    throw new Error(
      'Major upgrades require the migration workflow. Run create-payload-app interactively, or @payloadcms/codemod upgrade.',
    )
  }
  if (!plan.changes.length && !plan.overridesRemoved.length) {
    return {
      isUpdated: false,
      message: `Payload v${project.currentVersion} is already up to date.`,
      success: true,
      targetVersion: target,
    }
  }
  if (cliArgs?.['--dry-run']) {
    return {
      isUpdated: false,
      message: 'Dry run: no files changed.',
      success: true,
      targetVersion: target,
    }
  }

  // Bundled v4 wrappers cannot replace wrappers in a project staying on v3.
  if (canRefreshWrappers({ version: target })) {
    beforeInstall?.()
  }
  if (fse.readFileSync(project.packageJsonPath, 'utf8') !== project.originalText) {
    throw new Error('package.json changed after planning. Run the upgrade again.')
  }
  const data = applyUpgradePlan({ plan })
  const indent = project.originalText.match(/\n([\t ]+)"/)?.[1] ?? '  '
  const nextText = JSON.stringify(data, null, indent) + '\n'
  fse.writeFileSync(project.packageJsonPath, nextText)
  if (cliArgs?.['--no-deps']) {
    return {
      isUpdated: false,
      message: 'Updated package.json. Install dependencies before continuing.',
      success: true,
      targetVersion: target,
    }
  }
  const packageManager = await getPackageManager({ cliArgs, projectDir })
  info(`Installing Payload v${target} with ${packageManager}...`)
  try {
    const { exitCode } = await execa(packageManager, ['install'], {
      cwd: projectDir,
      env: { ...process.env, COREPACK_ENABLE_DOWNLOAD_PROMPT: '0' },
      reject: false,
      stdio: 'inherit',
    })
    if (exitCode !== 0) {
      throw new Error('Dependency installation failed.')
    }
    for (const change of plan.changes) {
      const installedVersion = readInstalledVersion({ name: change.name, projectDir })
      if (installedVersion !== change.to) {
        throw new Error(
          `${change.name} resolved to ${installedVersion ?? 'missing'}, expected ${change.to}.`,
        )
      }
    }
  } catch (error) {
    if (fse.readFileSync(project.packageJsonPath, 'utf8') === nextText) {
      fse.writeFileSync(project.packageJsonPath, project.originalText)
    }
    throw new Error(
      `${error instanceof Error ? error.message : String(error)} Dependencies or the lockfile may be partially changed. Reinstall the original dependencies before retrying.`,
    )
  }
  return {
    isUpdated: true,
    message: 'Payload updated successfully.',
    success: true,
    targetVersion: target,
  }
}

function canRefreshWrappers({ version }: { version: string }): boolean {
  const ownVersion = fse.readJsonSync(path.resolve(dirname, '../../package.json')).version as string
  return semver.major(version) === semver.major(ownVersion)
}

function resolveTanStackTemplateRoot(): string {
  return path.basename(path.dirname(dirname)) === 'dist'
    ? path.resolve(dirname, '../template-tanstack')
    : path.resolve(dirname, '../../../../templates/blank-tanstack/src')
}
