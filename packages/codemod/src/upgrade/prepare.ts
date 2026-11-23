/* eslint-disable no-console */
import * as p from '@clack/prompts'

import type { FetchRegistry, UpgradePlan } from '../upgrade-shared/index.js'

import {
  createRegistryClient,
  createUpgradePlan,
  formatUpgradePlan,
  readProject,
  resolveTargets,
} from '../upgrade-shared/index.js'
import { payloadPackageNames } from '../upgrade-shared/payload-package-names.js'
import { assertMigrationNodeVersion, formatMigrationPreview } from '../upgrade-shared/toolchain.js'
import { resolveDefaultTag } from './defaultTag.js'
import { resolveVersions } from './resolveVersions.js'

/** Resolve and preview the package plan before any install, transform, or agent starts. */
export async function prepareUpgrade({
  path,
  fetchRegistry = createRegistryClient({ projectDir: path }),
  isInteractive = Boolean(process.stdin.isTTY && process.stdout.isTTY),
  shouldConfirm = false,
  tag,
}: {
  fetchRegistry?: FetchRegistry
  isInteractive?: boolean
  path: string
  shouldConfirm?: boolean
  tag?: string
}): Promise<undefined | UpgradePlan> {
  const project = readProject({ projectDir: path })
  const targets = await resolveTargets({
    defaultTag: resolveDefaultTag(),
    explicitTarget: tag,
    fetchRegistry,
    project,
  })
  let targetVersion = targets[0]?.version
  if (!tag) {
    if (!isInteractive) {
      throw new Error(
        `Detected Payload ${project.currentVersion}. Choose a target with --tag <version-or-dist-tag>. Available targets: ${targets.map(({ label, version }) => `${label} (${version})`).join('; ')}.`,
      )
    }
    const choice = await p.select({
      message: `Detected Payload ${project.currentVersion}. What would you like to do?`,
      options: [
        ...targets.map(({ label, version }) => ({ label, value: version })),
        { label: 'Cancel', value: 'cancel' },
      ],
    })
    if (p.isCancel(choice) || choice === 'cancel') {
      return undefined
    }
    targetVersion = choice
  }
  if (!targetVersion) {
    throw new Error('No upgrade target is available for this project.')
  }
  const plan = await createUpgradePlan({
    corePackageNames: payloadPackageNames,
    fetchRegistry,
    project,
    targetVersion,
  })
  if (plan.blockers.length > 0) {
    console.log(formatUpgradePlan({ plan }))
    throw new Error('Resolve the package compatibility issues above before upgrading.')
  }
  let migrationPreview = ''
  if (plan.kind === 'migrate') {
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

  console.log([formatUpgradePlan({ plan }), migrationPreview].filter(Boolean).join('\n'))

  if (shouldConfirm && isInteractive) {
    const confirmed = await p.confirm({
      initialValue: false,
      message: 'Continue with this upgrade?',
    })
    if (p.isCancel(confirmed) || !confirmed) {
      return undefined
    }
  }
  return plan
}
