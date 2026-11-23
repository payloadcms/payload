import * as p from '@clack/prompts'
import execa from 'execa'
import fse from 'fs-extra'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import semver from 'semver'

import type { CliArgs, NextAppDetails, TanStackAppDetails } from '../types.js'

import {
  createRegistryClient,
  createUpgradePlan,
  formatUpgradePlan,
  readProject,
  resolveTargets,
} from '../upgrade-shared/index.js'
import { payloadPackageNames } from '../upgrade-shared/payload-package-names.js'
import {
  assertMigrationNodeVersion,
  formatMigrationPreview,
  resolveVersions,
} from '../upgrade-shared/toolchain.js'
import { DEFAULT_PAYLOAD_VERSION_TAG } from '../utils/resolvePackageVersion.js'
import { getPackageManager } from './get-package-manager.js'
import {
  updatePayloadInNextProject,
  updatePayloadInTanStackProject,
  updatePayloadPackages,
} from './update-payload-in-project.js'

export function hasPayloadDependency({ projectDir }: { projectDir: string }): boolean {
  const packagePath = path.join(projectDir, 'package.json')
  if (!fse.existsSync(packagePath)) {
    return false
  }
  const data = fse.readJsonSync(packagePath)
  return Boolean(data.dependencies?.payload || data.devDependencies?.payload)
}

/** Plan every package before changing files or starting a migration. */
export async function upgradeProject({
  cliArgs,
  nextAppDetails,
  projectDir,
  tanStackAppDetails,
}: {
  cliArgs: CliArgs
  nextAppDetails?: NextAppDetails
  projectDir: string
  tanStackAppDetails?: TanStackAppDetails
}): Promise<void> {
  const isInteractive = Boolean(process.stdin.isTTY && process.stdout.isTTY)
  if (isInteractive) {
    p.log.warn('Payload installation detected in current project.')
    const shouldUpdate = await p.confirm({
      initialValue: false,
      message: 'Upgrade Payload in this project?',
    })
    if (p.isCancel(shouldUpdate) || !shouldUpdate) {
      return
    }
  }
  const project = readProject({ projectDir })
  const fetchRegistry = createRegistryClient({ projectDir })
  p.log.info(`Payload v${project.currentVersion} detected.`)
  const targets = await resolveTargets({
    defaultTag: DEFAULT_PAYLOAD_VERSION_TAG,
    explicitTarget: cliArgs['--payload-version'],
    fetchRegistry,
    project,
  })
  if (!targets.length) {
    throw new Error('No supported Payload upgrade targets found.')
  }
  if (!isInteractive && !cliArgs['--payload-version']) {
    p.log.info(
      'Choose a target explicitly with --payload-version <version-or-tag>. Available targets:\n' +
        targets.map(({ label, version }) => `  ${label}: ${version}`).join('\n'),
    )
    return
  }
  const newerMajor = targets.find(
    ({ version }) => semver.major(version) > semver.major(project.currentVersion),
  )
  if (isInteractive && !cliArgs['--payload-version'] && targets.length > 1 && newerMajor) {
    p.log.info('A newer major version of Payload is available.')
  }
  const target =
    cliArgs['--payload-version'] || targets.length === 1
      ? targets[0]!.version
      : await p.select({
          message: 'Which version would you like to update to?',
          options: [
            ...targets.map(({ label, version }) => ({ label, value: version })),
            { label: 'Cancel', value: 'cancel' },
          ],
        })
  if (p.isCancel(target) || typeof target !== 'string' || target === 'cancel') {
    return
  }
  const plan = await createUpgradePlan({
    corePackageNames: payloadPackageNames,
    fetchRegistry,
    project,
    targetVersion: target,
  })
  let migrationPreview = ''
  if (plan.kind === 'migrate' && !plan.blockers.length) {
    plan.toolchain = await resolveVersions({
      fetchRegistry,
      hasNext: plan.project.dependencies.some(
        ({ name }) => name === 'next' || name === '@payloadcms/next',
      ),
      tag: plan.targetVersion,
    })
    assertMigrationNodeVersion({ resolved: plan.toolchain })
    migrationPreview = formatMigrationPreview({ plan, resolved: plan.toolchain })
  }
  p.note(
    [formatUpgradePlan({ plan }), migrationPreview].filter(Boolean).join('\n'),
    'Upgrade preview',
  )
  if (plan.blockers.length) {
    throw new Error('Resolve the issues listed above before upgrading.')
  }
  if (cliArgs['--dry-run']) {
    p.log.info('Dry run: no files changed.')
    return
  }
  if (!plan.changes.length && !plan.overridesRemoved.length && plan.kind === 'update') {
    p.log.success('Payload packages are already up to date.')
    return
  }
  if (!isInteractive) {
    p.log.info(
      'Rerun in an interactive terminal to confirm the upgrade, or use @payloadcms/codemod upgrade run --tag ' +
        target +
        '.',
    )
    return
  }
  const shouldProceed = await p.confirm({
    initialValue: false,
    message:
      plan.kind === 'migrate'
        ? 'Apply these package updates and begin the migration workflow?'
        : 'Apply these package updates?',
  })
  if (p.isCancel(shouldProceed) || !shouldProceed) {
    return
  }
  if (plan.kind === 'migrate') {
    if (cliArgs['--no-deps']) {
      throw new Error(
        'A major migration needs dependency installation. Remove --no-deps to continue.',
      )
    }
    p.log.info(
      'The codemod will guide the major migration, including prerequisites and framework changes.',
    )
    const ownVersion = fse.readJsonSync(
      fileURLToPath(new URL('../../package.json', import.meta.url)),
    ).version as string
    // A source checkout must exercise its local codemod, including unpublished changes.
    const localCodemod = fileURLToPath(new URL('../../../codemod/bin/cli.js', import.meta.url))
    const hasLocalCodemod =
      fse.existsSync(localCodemod) &&
      fse.existsSync(path.resolve(localCodemod, '../../dist/cli.js'))
    const command = hasLocalCodemod ? process.execPath : 'npx'
    const prefix = hasLocalCodemod ? [localCodemod] : ['--yes', `@payloadcms/codemod@${ownVersion}`]
    const packageManager = await getPackageManager({ cliArgs, projectDir })
    const { exitCode } = await execa(
      command,
      [
        ...prefix,
        'upgrade',
        ...(cliArgs['--no-agent'] ? ['run'] : []),
        '--tag',
        target,
        '--yes',
        '--package-manager',
        packageManager,
      ],
      { cwd: projectDir, reject: false, stdio: 'inherit' },
    )
    if (exitCode !== 0) {
      throw new Error(
        'The migration workflow did not complete. Review its output before continuing.',
      )
    }
    return
  }
  const args = { cliArgs, plan, versionOrTag: target }
  const result = nextAppDetails
    ? await updatePayloadInNextProject({ appDetails: nextAppDetails, ...args })
    : tanStackAppDetails
      ? await updatePayloadInTanStackProject({ appDetails: tanStackAppDetails, ...args })
      : await updatePayloadPackages({ projectDir, ...args })
  if (!result.success) {
    throw new Error(result.message)
  }
  p.log.success(result.message)
}
