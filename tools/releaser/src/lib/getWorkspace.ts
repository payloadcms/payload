import type { ReleaseType } from 'semver'

import { PROJECT_ROOT, ROOT_PACKAGE_JSON } from '@tools/constants'
import { execSync, spawn } from 'child_process'
import execa from 'execa'
import fse from 'fs-extra'
import path from 'path'
import semver from 'semver'

import type { PublishResult } from './runPublishSequence.js'

import { getPackageDetails } from './getPackageDetails.js'
import { isVersionPublished } from './getPackageRegistryVersions.js'
import { packagePublishList } from './publishList.js'
import { runPublishSequence } from './runPublishSequence.js'

const cwd = PROJECT_ROOT

const execaOpts: execa.Options = { stdio: 'inherit', cwd }

type PackageDetails = {
  /** Name in package.json / npm registry */
  name: string
  /** Full path to package relative to project root */
  packagePath: `packages/${string}`
  /** Short name is the directory name */
  shortName: string
  /** Version in package.json */
  version: string
}

type PackageReleaseType = 'canary' | 'internal' | 'internal-debug' | ReleaseType

type PublishOpts = {
  dryRun?: boolean
  tag?: 'beta' | 'canary' | 'internal' | 'internal-debug' | 'latest'
}

type Workspace = {
  version: () => Promise<string>
  bumpVersion: (type: PackageReleaseType, opts?: { preid?: 'beta' | 'canary' }) => Promise<string>
  build: (opts?: { debug?: boolean }) => Promise<void>
  publish: (opts: PublishOpts) => Promise<void>
}

export const getWorkspace = (): Workspace => {
  const build = async (opts?: { debug?: boolean }) => {
    await execa('pnpm', ['install'], execaOpts)

    const buildCommand = opts?.debug ? 'build:debug' : 'build:all'
    const buildResult = await execa('pnpm', [buildCommand, '--output-logs=errors-only'], execaOpts)
    if (buildResult.exitCode !== 0) {
      console.error('Build failed')
      console.log(buildResult.stderr)
      throw new Error('Build failed')
    }
  }

  // Publish one package at a time, fail-fast at the first failure.
  const publish: Workspace['publish'] = async ({ dryRun, tag = 'canary' }) => {
    const packageDetails = await getPackageDetails(packagePublishList)
    await runPublishSequence({
      packages: packageDetails,
      publishOne: (pkg) => publishSinglePackage(pkg, { dryRun, tag }),
    })
  }

  const setVersion = async (version: string) => {
    const rootPackageJson = await fse.readJSON(ROOT_PACKAGE_JSON)
    rootPackageJson.version = version
    await fse.writeJSON(ROOT_PACKAGE_JSON, rootPackageJson, { spaces: 2 })

    const packageJsons = await getPackageDetails(packagePublishList)
    await Promise.all(
      packageJsons.map(async (pkg) => {
        const packageJsonPath = path.resolve(PROJECT_ROOT, `${pkg.packagePath}/package.json`)
        const packageJson = await fse.readJSON(packageJsonPath)
        packageJson.version = version
        await fse.writeJSON(packageJsonPath, packageJson, { spaces: 2 })
      }),
    )
  }

  const bumpVersion = async (
    bumpType: PackageReleaseType,
    opts?: { preid?: 'beta' | 'canary' },
  ): Promise<string> => {
    const { version: monorepoVersion, packages: packageDetails } = await getCurrentPackageState()
    const { preid } = opts ?? {}

    let nextReleaseVersion
    if (bumpType === 'internal') {
      const hash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim().slice(0, 7)
      nextReleaseVersion = semver.inc(monorepoVersion, 'minor') + `-internal.${hash}`
    } else if (bumpType === 'internal-debug') {
      const hash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim().slice(0, 7)
      nextReleaseVersion = semver.inc(monorepoVersion, 'minor') + `-internal-debug.${hash}`
    } else if (
      bumpType === 'premajor' ||
      bumpType === 'preminor' ||
      bumpType === 'prepatch' ||
      bumpType === 'prerelease'
    ) {
      nextReleaseVersion = semver.inc(monorepoVersion, bumpType, undefined, preid)
    } else if (bumpType === 'canary') {
      const minorCandidateBaseVersion = semver.inc(monorepoVersion, 'minor')

      if (!minorCandidateBaseVersion) {
        throw new Error(`Could not determine minor candidate version from ${monorepoVersion}`)
      }

      // Get latest canary version from registry
      const json = await fetch(`https://registry.npmjs.org/payload`).then((res) => res.json())
      const { canary: latestCanaryVersion } = (json['dist-tags'] ?? {}) as {
        canary?: string | undefined
      }

      console.log(`Latest canary version: ${latestCanaryVersion}`)

      if (
        latestCanaryVersion?.startsWith(minorCandidateBaseVersion) &&
        latestCanaryVersion.includes('-canary.')
      ) {
        const canaryIteration = Number(latestCanaryVersion.split('-canary.')[1])
        if (isNaN(canaryIteration)) {
          console.log(`Latest canary version is not a valid canary version, starting from 0`)
          nextReleaseVersion = semver.inc(monorepoVersion, 'minor') + '-canary.0'
        } else {
          console.log(`Incrementing canary version from ${latestCanaryVersion}`)
          nextReleaseVersion = `${minorCandidateBaseVersion}-canary.${canaryIteration + 1}`
        }
      } else {
        console.log(`Latest canary does not match minor candidate, incrementing minor`)
        nextReleaseVersion = semver.inc(monorepoVersion, 'minor') + '-canary.0'
      }
    } else {
      throw new Error(
        `Invalid bump type: ${bumpType}. Supported types: internal, internal-debug, canary, premajor, preminor, prepatch, prerelease.`,
      )
    }

    if (!nextReleaseVersion) {
      throw new Error(
        `Invalid bump type: ${bumpType}. Could not determine next version from ${monorepoVersion}.`,
      )
    }

    console.log(`\n  Version: ${monorepoVersion} => ${nextReleaseVersion}\n`)
    console.log(`  Bump: ${bumpType}`)
    console.log(`  Changes (${packageDetails.length} packages):\n`)
    console.log(
      `${packageDetails.map((p) => `  - ${p.name.padEnd(32)} ${p.version} => ${nextReleaseVersion}`).join('\n')}\n`,
    )

    await setVersion(nextReleaseVersion)
    return nextReleaseVersion
  }

  const workspace: Workspace = {
    version: async () => (await fse.readJSON(ROOT_PACKAGE_JSON)).version,
    bumpVersion,
    build,
    publish,
  }

  return workspace
}

async function getCurrentPackageState(): Promise<{
  packages: PackageDetails[]
  version: string
}> {
  const packageDetails = await getPackageDetails(packagePublishList)
  const rootPackageJson = await fse.readJSON(ROOT_PACKAGE_JSON)
  return { packages: packageDetails, version: rootPackageJson.version }
}

export async function publishSinglePackage(
  pkg: PackageDetails,
  opts: PublishOpts,
): Promise<PublishResult> {
  const { dryRun, tag = 'canary' } = opts

  try {
    // The pre-check is an optimization to skip already-published packages. A
    // registry failure here must not be fatal — fall through and let the publish
    // attempt (and its post-failure recheck) decide the outcome.
    if (!dryRun) {
      let alreadyPublished = false
      try {
        alreadyPublished = await isVersionPublished({ name: pkg.name, version: pkg.version })
      } catch (err: unknown) {
        console.warn(
          `⚠️  Could not verify whether ${pkg.name}@${pkg.version} is published; proceeding to publish. (${err instanceof Error ? err.message : String(err)})`,
        )
      }

      if (alreadyPublished) {
        console.log(`⏭️  ${pkg.name}@${pkg.version} already published, skipping`)
        return { name: pkg.name, success: true }
      }
    }

    console.log(`🚀 ${pkg.name} publishing...`)

    const cmdArgs = ['publish', '-C', pkg.packagePath, '--no-git-checks', '--tag', tag]
    if (dryRun) {
      cmdArgs.push('--dry-run')
    }

    const { exitCode, output } = await runPnpm(cmdArgs)

    if (exitCode === 0) {
      console.log(`✅ ${pkg.name} published`)
      return { name: pkg.name, success: true }
    }

    // An already-published conflict means a prior run landed this version; treat
    // the re-run as an idempotent success rather than retrying (a retry would
    // just conflict again). This is authoritative, unlike the CDN-cached read.
    if (isAlreadyPublishedError(output)) {
      console.log(`⏭️  ${pkg.name}@${pkg.version} already published, skipping`)
      return { name: pkg.name, success: true }
    }

    console.log(`\n\n❌ ${pkg.name} ERROR: pnpm publish failed (exit code ${exitCode})`)
    console.log(`\nRetrying publish for ${pkg.name}...`)
    const { exitCode: retryExitCode, output: retryOutput } = await runPnpm(cmdArgs)

    if (retryExitCode === 0) {
      console.log(`✅ ${pkg.name} published (on retry)`)
      return { name: pkg.name, success: true }
    }

    if (isAlreadyPublishedError(retryOutput)) {
      console.log(`⏭️  ${pkg.name}@${pkg.version} already published, skipping`)
      return { name: pkg.name, success: true }
    }

    // Publish can report failure even though the version actually landed (e.g. a
    // dropped connection after the registry accepted it). Recheck the registry.
    if (!dryRun && (await isVersionPublished({ name: pkg.name, version: pkg.version }))) {
      console.log(`✅ ${pkg.name}@${pkg.version} landed despite publish error`)
      return { name: pkg.name, success: true }
    }

    return {
      name: pkg.name,
      success: false,
      details: `pnpm publish failed for ${pkg.name} (exit code ${retryExitCode})`,
    }
  } catch (err: unknown) {
    console.error(err)
    return {
      name: pkg.name,
      success: false,
      details:
        err instanceof Error
          ? `Error publishing ${pkg.name}: ${err.message}`
          : `Unexpected error publishing ${pkg.name}: ${String(err)}`,
    }
  }
}

type PnpmResult = {
  exitCode: number
  /** Combined stdout + stderr, captured while also streaming live. */
  output: string
}

/**
 * Runs `pnpm <args>`, streaming output live to the parent while also capturing
 * it. Resolves with the exit code and combined output — a non-zero exit resolves
 * (unlike execa's default, which rejects) so callers can branch on the code and
 * inspect the output. Only a spawn error (e.g. pnpm not found) rejects.
 */
function runPnpm(args: string[]): Promise<PnpmResult> {
  return new Promise((resolve, reject) => {
    const child = spawn('pnpm', args, { cwd, stdio: ['inherit', 'pipe', 'pipe'] })
    let output = ''
    child.stdout?.on('data', (chunk: Buffer) => {
      output += chunk.toString()
      process.stdout.write(chunk)
    })
    child.stderr?.on('data', (chunk: Buffer) => {
      output += chunk.toString()
      process.stderr.write(chunk)
    })
    child.on('error', reject)
    child.on('close', (code) => resolve({ exitCode: code ?? 1, output }))
  })
}

/**
 * npm rejects re-publishing an existing version with an EPUBLISHCONFLICT / "cannot
 * publish over the previously published versions" error. That is the authoritative
 * signal that a version is already published — unlike the CDN-cached registry read,
 * which can serve a stale 404 — so callers treat it as an idempotent success.
 */
const isAlreadyPublishedError = (output: string): boolean =>
  /EPUBLISHCONFLICT|cannot publish over|previously published version/i.test(output)
