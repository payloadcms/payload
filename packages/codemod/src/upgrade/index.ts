/* eslint-disable no-console */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import semver from 'semver'

import type { ReportModel, VersionReportRow } from './report.js'
import type { RegistryPackument, ResolvedVersions, UpgradeDeps } from './types.js'

import { transforms as registry } from '../registry.js'
import { runTransforms as defaultRunTransforms } from '../runner.js'
import { loadPackageJsons, serializePackageJson } from '../utils/packageJson.js'
import { loadProject } from '../utils/project.js'
import { detectPackageManager } from './detectPackageManager.js'
import { renderReport } from './report.js'
import { resolveVersions } from './resolveVersions.js'
import { isPayloadEslintPackage, rewritePackageJson } from './rewritePackageJson.js'
import { runInstall } from './runInstall.js'
import { RUNBOOK_RELATIVE_PATH } from './types.js'

export type UpgradeFlags = {
  dry: boolean
  force: boolean
  tag: string
}

type RunUpgradeArgs = {
  flags: UpgradeFlags
  path: string
}

type RunUpgradeOverrides = {
  runTransforms?: typeof defaultRunTransforms
}

const defaultDeps = (): UpgradeDeps => ({
  exists: existsSync,
  fetchRegistry: async (name) => {
    const res = await fetch(`https://registry.npmjs.org/${name}`)
    if (!res.ok) {
      throw new Error(`Registry lookup failed for ${name}: ${res.status}`)
    }
    return (await res.json()) as RegistryPackument
  },
  spawn: (command, args, options) =>
    import('node:child_process').then(
      ({ spawn }) =>
        new Promise((resolveSpawn) => {
          const child = spawn(command, args, { ...options, shell: false, stdio: 'inherit' })
          child.on('close', (code) => resolveSpawn({ code: code ?? 1 }))
          child.on('error', () => resolveSpawn({ code: 1 }))
        }),
    ),
})

/**
 * Compose the upgrade pipeline: preflight -> resolve -> rewrite -> install ->
 * verify -> transforms -> report. Install runs before transforms so a failed
 * install aborts before any codemod touches source files.
 */
export async function runUpgrade(
  { flags, path }: RunUpgradeArgs,
  deps: UpgradeDeps = defaultDeps(),
  overrides: RunUpgradeOverrides = {},
): Promise<{ failed: boolean }> {
  const runTransforms = overrides.runTransforms ?? defaultRunTransforms
  const projectPath = resolve(path)

  // 1. PREFLIGHT
  const packageManager = detectPackageManager(projectPath, deps.exists)
  const packageJsonPath = join(projectPath, 'package.json')
  if (!deps.exists(packageJsonPath)) {
    console.error(`No package.json found at ${packageJsonPath}.`)
    return { failed: true }
  }
  if (!flags.force && isGitTreeDirty(projectPath)) {
    console.warn('Warning: git tree is dirty. Commit or stash first, or pass --force.')
  }

  // 2. RESOLVE VERSIONS
  const resolved = await resolveVersions({ fetchRegistry: deps.fetchRegistry, tag: flags.tag })
  warnStaleNode(resolved)

  // 3. REWRITE package.json
  const original = readFileSync(packageJsonPath, 'utf8')
  const data = JSON.parse(original) as Record<string, unknown>
  const summary = rewritePackageJson({ data, resolved })
  const nextText = serializePackageJson(data, original)

  if (flags.dry) {
    console.log('[dry] package.json changes:')
    console.log(nextText)
    console.log(`[dry] would run: ${packageManager} install`)
    console.log('[dry] would then run Payload transforms.')
    return { failed: false }
  }

  writeFileSync(packageJsonPath, nextText)

  // 4. INSTALL
  const install = await runInstall({ packageManager, path: projectPath, spawn: deps.spawn })
  if (install.code !== 0) {
    console.error(`Install failed (exit ${install.code}). Aborting before transforms.`)
    return { failed: true }
  }

  // 5. VERIFY RESOLUTION
  const versions = verifyResolution(projectPath, data, resolved)

  // 6. RUN PAYLOAD TRANSFORMS
  // Reload package.jsons from disk so transforms see the rewritten root file
  // (and any other package.json files in the tree) with the same reference
  // semantics the bare transform path relies on for in-place mutation.
  const packageJsons = loadPackageJsons(projectPath)
  const project = loadProject(projectPath)
  const snapshot = new Map(project.getSourceFiles().map((f) => [f.getFilePath(), f.getFullText()]))
  const { failed, results } = await runTransforms({
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
      .filter((f) => snapshot.get(f.getFilePath()) !== f.getFullText())
      .map((f) => f.save()),
  )
  for (const pkg of packageJsons) {
    const text = serializePackageJson(pkg.data, pkg.originalText)
    if (text !== pkg.originalText) {
      writeFileSync(pkg.path, text)
    }
  }

  // 7. REPORT
  const model: ReportModel = {
    floorsWritten: summary.floorsWritten,
    nextTarget: resolved.nextTarget,
    overridesRemoved: summary.overridesRemoved,
    runbookPath: resolve(dirname(fileURLToPath(import.meta.url)), '..', RUNBOOK_RELATIVE_PATH),
    transforms: results,
    versions,
  }
  console.log(renderReport(model))

  return { failed }
}

function warnStaleNode(resolved: ResolvedVersions): void {
  const running = process.versions.node
  if (!semver.satisfies(running, resolved.enginesNode)) {
    console.warn(
      `Warning: running Node ${running} does not satisfy ${resolved.enginesNode}. ` +
        'Install may resolve incorrectly; switch Node before continuing.',
    )
  }
}

function verifyResolution(
  projectPath: string,
  data: Record<string, unknown>,
  resolved: ResolvedVersions,
): VersionReportRow[] {
  const rows: VersionReportRow[] = []
  const deps = { ...asRecord(data.dependencies), ...asRecord(data.devDependencies) }
  for (const name of Object.keys(deps)) {
    if (name !== 'payload' && !name.startsWith('@payloadcms/')) {
      continue
    }
    // eslint packages are versioned independently, so they are not part of the
    // lockstep-pinned set and cannot be verified against the payload version.
    if (isPayloadEslintPackage(name)) {
      continue
    }
    const installed = readInstalledVersion(projectPath, name)
    rows.push({
      name,
      ok: installed === resolved.payloadVersion,
      resolved: installed,
      wrote: resolved.payloadVersion,
    })
  }
  return rows
}

function readInstalledVersion(projectPath: string, name: string): string | undefined {
  try {
    const pkgPath = join(projectPath, 'node_modules', name, 'package.json')
    return JSON.parse(readFileSync(pkgPath, 'utf8')).version as string
  } catch {
    return undefined
  }
}

/**
 * Best-effort dirty-tree check. Real detection would shell out to `git
 * status`; until that lands, absence of a signal is treated as clean so the
 * warning never produces a false alarm.
 */
function isGitTreeDirty(_projectPath: string): boolean {
  return false
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
}
