/* eslint-disable no-console */
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { UpgradePlan } from '../upgrade-shared/index.js'
import type { ResolvedVersions } from '../upgrade-shared/toolchain.js'
import type { ReportModel, VersionReportRow } from './report.js'
import type { PackageManager, UpgradeDeps } from './types.js'

import { transforms as registry } from '../registry.js'
import { runTransforms as defaultRunTransforms } from '../runner.js'
import {
  applyUpgradePlan,
  createRegistryClient,
  readInstalledVersion,
} from '../upgrade-shared/index.js'
import {
  assertMigrationNodeVersion,
  resolveVersions,
  writeFloors,
} from '../upgrade-shared/toolchain.js'
import { loadPackageJsons, serializePackageJson } from '../utils/packageJson.js'
import { loadProject } from '../utils/project.js'
import { detectPackageManager } from './detectPackageManager.js'
import { prepareUpgrade } from './prepare.js'
import { renderReport } from './report.js'
import { runInstall } from './runInstall.js'
import { resolveSelfCommand } from './selfCommand.js'
import { MIGRATION_GUIDE_RELATIVE_PATH, RUNBOOK_RELATIVE_PATH } from './types.js'

export type UpgradeFlags = {
  dry: boolean
  force: boolean
  packageManager?: PackageManager
  /** Dist-tag or exact target version. Without it, an interactive target picker is shown. */
  tag?: string
  /** Skip confirmation after preview; target selection still requires an explicit choice. */
  yes?: boolean
}

type RunUpgradeArgs = {
  flags: UpgradeFlags
  path: string
  plan?: UpgradePlan
}

type RunUpgradeOverrides = {
  runTransforms?: typeof defaultRunTransforms
}

const defaultDeps = ({ path }: { path: string }): UpgradeDeps => ({
  exists: existsSync,
  fetchRegistry: createRegistryClient({ projectDir: path }),
  spawn: (command, args, options) =>
    new Promise((resolveSpawn) => {
      const child = spawn(command, args, { ...options, shell: false, stdio: 'inherit' })
      child.on('close', (code) => resolveSpawn({ code: code ?? 1 }))
      child.on('error', () => resolveSpawn({ code: 1 }))
    }),
})

/** Same-major updates install a package plan; only v3 -> v4 runs the migration. */
export async function runUpgrade(
  args: RunUpgradeArgs,
  deps: UpgradeDeps = defaultDeps({ path: args.path }),
  overrides: RunUpgradeOverrides = {},
): Promise<{ failed: boolean }> {
  try {
    return await performUpgrade({ args, deps, overrides })
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return { failed: true }
  }
}

async function performUpgrade({
  args: { flags, path, plan: preparedPlan },
  deps,
  overrides,
}: {
  args: RunUpgradeArgs
  deps: UpgradeDeps
  overrides: RunUpgradeOverrides
}): Promise<{ failed: boolean }> {
  const projectPath = resolve(path)
  const plan =
    preparedPlan ??
    (await prepareUpgrade({
      fetchRegistry: deps.fetchRegistry,
      path: projectPath,
      shouldConfirm: !flags.dry && !flags.yes,
      tag: flags.tag,
    }))
  if (!plan) {
    return { failed: false }
  }
  if (plan.project.projectDir !== projectPath) {
    throw new Error('The upgrade plan belongs to a different project.')
  }
  if (plan.blockers.length > 0) {
    throw new Error(plan.blockers.join('\n'))
  }
  const packageJsonPath = join(projectPath, 'package.json')
  const original = readFileSync(packageJsonPath, 'utf8')
  if (original !== plan.project.originalText) {
    throw new Error(
      'package.json changed after planning. Run the upgrade again to review a fresh plan.',
    )
  }
  const packageManager = flags.packageManager ?? detectPackageManager(projectPath, deps.exists)
  if (!flags.force && isGitTreeDirty(projectPath)) {
    console.warn('Warning: git tree is dirty. Commit or stash first, or pass --force.')
  }

  let resolved: ResolvedVersions | undefined
  const data = applyUpgradePlan({ plan })
  let floorsWritten: string[] = []
  if (plan.kind === 'migrate') {
    resolved =
      plan.toolchain ??
      (await resolveVersions({
        fetchRegistry: deps.fetchRegistry,
        hasNext: plan.project.dependencies.some(
          ({ name }) => name === 'next' || name === '@payloadcms/next',
        ),
        tag: plan.targetVersion,
      }))
    assertMigrationNodeVersion({ resolved })
    floorsWritten = writeFloors({ data, resolved })
  }
  if (plan.kind === 'update' && plan.changes.length === 0 && plan.overridesRemoved.length === 0) {
    console.log('Payload packages are already up to date.')
    return { failed: false }
  }
  if (flags.dry) {
    console.log(`[dry] would run: ${packageManager} install`)
    if (plan.kind === 'migrate') {
      console.log('[dry] would then run the Payload v3 -> v4 transforms.')
    }
    return { failed: false }
  }
  const nextText = serializePackageJson(data, original)
  writeFileSync(packageJsonPath, nextText)
  const shouldAllowTransitionalPeers = plan.kind === 'migrate' && packageManager === 'npm'
  if (shouldAllowTransitionalPeers) {
    console.warn(
      'Installing with npm --legacy-peer-deps for the v3 -> v4 transition. Complete the framework upgrade and verify peer dependencies afterward.',
    )
  }
  const install = await runInstall({
    packageManager,
    path: projectPath,
    shouldAllowTransitionalPeers,
    spawn: deps.spawn,
  })
  if (install.code !== 0) {
    restoreManifest({ original, packageJsonPath, written: nextText })
    console.error(`Install failed (exit ${install.code}). Aborting before source transforms.`)
    return { failed: true }
  }
  const versions = verifyResolution({ plan, projectPath })
  const resolutionFailed = versions.some((version) => !version.ok)
  if (plan.kind === 'update') {
    if (resolutionFailed) {
      restoreManifest({ original, packageJsonPath, written: nextText })
    }
    for (const version of versions) {
      console.log(
        `${version.ok ? '[ok]' : '[FAIL]'} ${version.name}: ${version.resolved ?? 'not installed'} (expected ${version.wrote})`,
      )
    }
    return { failed: resolutionFailed }
  }
  if (resolutionFailed) {
    restoreManifest({ original, packageJsonPath, written: nextText })
    console.error('Installed packages do not match the upgrade plan. Aborting before transforms.')
    for (const version of versions.filter((version) => !version.ok)) {
      console.error(
        `${version.name}: ${version.resolved ?? 'not installed'} (expected ${version.wrote})`,
      )
    }
    return { failed: true }
  }

  const packageJsons = loadPackageJsons(projectPath)
  const project = loadProject(projectPath)
  const snapshot = new Map(
    project.getSourceFiles().map((file) => [file.getFilePath(), file.getFullText()]),
  )
  const { failed, results } = await (overrides.runTransforms ?? defaultRunTransforms)({
    packageJsons: packageJsons.map(({ data: pkgData, path: pkgPath }) => ({
      data: pkgData,
      path: pkgPath,
    })),
    project,
    transforms: registry,
  })
  await Promise.all(
    project
      .getSourceFiles()
      .filter((file) => snapshot.get(file.getFilePath()) !== file.getFullText())
      .map((file) => file.save()),
  )
  for (const pkg of packageJsons) {
    const text = serializePackageJson(pkg.data, pkg.originalText)
    if (text !== pkg.originalText) {
      writeFileSync(pkg.path, text)
    }
  }
  const distDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const migrationGuideAbsPath = join(distDir, MIGRATION_GUIDE_RELATIVE_PATH)
  const model: ReportModel = {
    floorsWritten,
    hasNext: plan.project.dependencies.some(
      ({ name }) => name === 'next' || name === '@payloadcms/next',
    ),
    migrationGuidePath: deps.exists(migrationGuideAbsPath) ? migrationGuideAbsPath : undefined,
    nextTarget: resolved!.nextTarget,
    overridesRemoved: plan.overridesRemoved,
    placeholdersSkipped: [],
    runbookPath: join(distDir, RUNBOOK_RELATIVE_PATH),
    transforms: results,
    versions,
  }
  console.log(renderReport(model))
  if (failed) {
    console.error(
      `Dependencies reached Payload ${plan.targetVersion}, but source migrations failed. After resolving the errors, rerun the idempotent transforms with \`${resolveSelfCommand()}\` (without upgrade).`,
    )
  }
  return { failed }
}

function verifyResolution({
  plan,
  projectPath,
}: {
  plan: UpgradePlan
  projectPath: string
}): VersionReportRow[] {
  const expected = new Map(plan.changes.map(({ name, to }) => [name, to]))
  // The core dependency is also verified when only independent plugins changed.
  expected.set('payload', plan.targetVersion)
  return [...expected].map(([name, wrote]) => {
    const installed = readInstalledVersion({ name, projectDir: projectPath })
    return { name, ok: installed === wrote, resolved: installed, wrote }
  })
}

function isGitTreeDirty(projectPath: string): boolean {
  const result = spawnSync('git', ['status', '--porcelain'], { cwd: projectPath, encoding: 'utf8' })
  return !result.error && result.status === 0 && result.stdout.trim().length > 0
}

function restoreManifest({
  original,
  packageJsonPath,
  written,
}: {
  original: string
  packageJsonPath: string
  written: string
}): void {
  if (readFileSync(packageJsonPath, 'utf8') === written) {
    writeFileSync(packageJsonPath, original)
    console.warn(
      'Restored the original package.json. Dependencies and the lockfile may be partly changed; reinstall with the original manifest before retrying.',
    )
  } else {
    console.warn(
      'package.json changed during installation and was preserved. Review it and the lockfile before retrying.',
    )
  }
}
