/**
 * CI drift guard for create-payload-app's build-script allowlist (ALLOWED_BUILDS in
 * packages/create-payload-app/src/lib/configure-pnpm-builds.ts).
 *
 * Replicates a create-payload-app scaffold of the blank template against the CURRENT source:
 * pack the local Payload packages, repoint the template's workspace:* deps at those tarballs,
 * write the scaffold's pnpm-workspace.yaml via the real ensurePnpmBuildApprovals, then install
 * it standalone under pnpm v11. Packing source (rather than installing the published version)
 * is what makes this catch drift early — a dependency added in this commit that ships a build
 * script the allowlist doesn't approve makes v11 fail the install with ERR_PNPM_IGNORED_BUILDS
 * (the exact error a user would hit), and this script surfaces the offending packages.
 */
import { PROJECT_ROOT, TEMPLATES_DIR } from '@tools/constants'
import { ensurePnpmBuildApprovals } from 'create-payload-app/lib/configure-pnpm-builds.js'
import { copyRecursiveSync } from 'create-payload-app/utils/copy-recursive-sync.js'
import { spawnSync } from 'node:child_process'
import * as fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { mapTarballsToFileSpecs } from './local-package-tarballs.js'

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

async function main() {
  assertPnpmV11()

  const projectDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cpa-build-approvals-'))
  try {
    copyRecursiveSync(path.join(TEMPLATES_DIR, 'blank'), projectDir, [
      'node_modules',
      '\\*\\.tgz',
      '.next',
      '.env$',
      'pnpm-lock.yaml',
    ])

    packLocalPackages(projectDir)
    const fileSpecByPackageName = await mapTarballsToFileSpecs(projectDir)
    await repointWorkspaceDepsAtTarballs(projectDir, fileSpecByPackageName)

    // Override every Payload package name to its tarball so the packed tarballs' transitive
    // @payloadcms/* deps resolve to local source too, not the registry. ensurePnpmBuildApprovals
    // then merges the scaffold's allowBuilds into this same file, leaving the install otherwise
    // identical to what a real `create-payload-app` produces.
    await writeOverrides(projectDir, fileSpecByPackageName)
    await ensurePnpmBuildApprovals({ packageManager: 'pnpm', projectDir })

    const ignored = installAndCollectIgnoredBuilds(projectDir)
    if (ignored.length > 0) {
      console.error(
        `\n❌ Scaffolded blank project has unapproved build scripts: ${ignored.join(', ')}.\n` +
          `   Add them to ALLOWED_BUILDS in packages/create-payload-app/src/lib/configure-pnpm-builds.ts,\n` +
          `   otherwise users hit ERR_PNPM_IGNORED_BUILDS when scaffolding under pnpm v11.\n`,
      )
      process.exit(1)
    }

    console.log('\n✅ All scaffold build scripts are approved — ALLOWED_BUILDS is in sync.')
  } finally {
    await fs.rm(projectDir, { recursive: true, force: true })
  }
}

/**
 * Packs the current source of every Payload package into `dest` as tarballs. `--no-build` skips
 * the upfront build:all (this check only reads dependency manifests, not compiled output), so it
 * relies on the `build` job's restored artifacts in CI.
 */
function packLocalPackages(dest: string): void {
  const result = spawnSync(
    'pnpm',
    ['--filter', 'scripts', 'pack-all-to-dest', '--all', '--no-build', '--dest', dest],
    { cwd: PROJECT_ROOT, encoding: 'utf8', stdio: 'inherit' },
  )
  if (result.status !== 0) {
    throw new Error('Failed to pack local packages.')
  }
}

/**
 * Replaces the template's workspace:* Payload specs with `file:` specs pointing at the packed
 * tarballs, so the standalone install resolves the current source. Throws if any workspace: spec
 * is left unmatched, since those cannot install outside the monorepo.
 */
async function repointWorkspaceDepsAtTarballs(
  projectDir: string,
  fileSpecByPackageName: Record<string, string>,
): Promise<void> {
  const packageJsonPath = path.join(projectDir, 'package.json')
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8')) as {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
  }

  for (const depKey of ['dependencies', 'devDependencies'] as const) {
    const deps = packageJson[depKey]
    if (!deps) {
      continue
    }
    for (const [name, spec] of Object.entries(deps)) {
      if (fileSpecByPackageName[name]) {
        deps[name] = fileSpecByPackageName[name]
      } else if (spec.startsWith('workspace:')) {
        throw new Error(`No packed tarball for workspace dependency "${name}".`)
      }
    }
  }

  await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
}

/** Writes a pnpm-workspace.yaml with an `overrides` block forcing each name to its tarball spec. */
async function writeOverrides(
  projectDir: string,
  fileSpecByPackageName: Record<string, string>,
): Promise<void> {
  const lines = ['overrides:']
  for (const [name, spec] of Object.entries(fileSpecByPackageName)) {
    lines.push(`  '${name}': '${spec}'`)
  }
  await fs.writeFile(path.join(projectDir, 'pnpm-workspace.yaml'), `${lines.join('\n')}\n`)
}

/**
 * Installs the scaffolded project under pnpm v11 and returns the packages whose build scripts
 * were blocked. Resolving from PROJECT_ROOT keeps the repo's pinned pnpm v11 in effect while
 * `--dir` targets the throwaway project. v11's default strictDepBuilds aborts the install when
 * a build script is unapproved, so an empty list means every required build is approved.
 */
function installAndCollectIgnoredBuilds(projectDir: string): string[] {
  const result = spawnSync('pnpm', ['install', '--no-frozen-lockfile', '--dir', projectDir], {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
  })

  if (result.status === 0) {
    return []
  }

  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`
  const ignored = parseIgnoredBuilds(output)
  if (ignored.length === 0) {
    console.error(output)
    throw new Error('pnpm install failed for a reason other than ignored build scripts.')
  }
  return ignored
}

function parseIgnoredBuilds(output: string): string[] {
  const captured = /Ignored build scripts:\s*(.+)/i.exec(output)?.[1]
  if (!captured) {
    return []
  }
  const names = captured
    .split(',')
    .map((entry) => entry.trim().replace(/@[^@]+$/, ''))
    .filter(Boolean)
  return [...new Set(names)]
}

function assertPnpmV11(): void {
  const result = spawnSync('pnpm', ['--version'], { cwd: PROJECT_ROOT, encoding: 'utf8' })
  const version = (result.stdout ?? '').trim()
  const major = Number(version.split('.')[0])
  if (!Number.isFinite(major) || major < 11) {
    throw new Error(
      `This check guards pnpm v11's strict build approvals and must run under pnpm v11+. Found "${version}".`,
    )
  }
}
