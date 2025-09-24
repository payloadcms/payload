import type { ReleaseType } from 'semver'

import { PROJECT_ROOT, ROOT_PACKAGE_JSON } from '@tools/constants'
import { execSync } from 'child_process'
import execa from 'execa'
import fse from 'fs-extra'
import pLimit from 'p-limit'
import path from 'path'
import semver from 'semver'

import { getPackageDetails } from './getPackageDetails.js'
import { packagePublishList } from './publishList.js'

const npmPublishLimit = pLimit(5)
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

type PackageReleaseType = 'canary' | 'internal' | ReleaseType

type PublishResult = {
  name: string
  success: boolean
  details?: string
}

type PublishOpts = {
  dryRun?: boolean
  tag?: 'beta' | 'canary' | 'latest'
}

type Workspace = {
  version: () => Promise<string>
  tag: string
  packages: PackageDetails[]
  showVersions: () => Promise<void>
  bumpVersion: (type: PackageReleaseType) => Promise<void>
  build: () => Promise<void>
  publish: (opts: PublishOpts) => Promise<void>
  publishSync: (opts: PublishOpts) => Promise<void>
}

export const getWorkspace = async () => {
  const build = async () => {
    await execa('pnpm', ['install'], execaOpts)

    const buildResult = await execa('pnpm', ['build:all', '--output-logs=errors-only'], execaOpts)
    if (buildResult.exitCode !== 0) {
      console.error('Build failed')
      console.log(buildResult.stderr)
      throw new Error('Build failed')
    }
  }

  // Publish one package at a time
  const publishSync: Workspace['publishSync'] = async ({ dryRun, tag = 'canary' }) => {
    const packageDetails = await getPackageDetails(packagePublishList)
    const results: PublishResult[] = []
    for (const pkg of packageDetails) {
      const res = await publishSinglePackage(pkg, { dryRun, tag })
      results.push(res)
    }

    console.log(`\n\nResults:\n`)

    console.log(
      results
        .map((result) => {
          if (!result.success) {
            console.error(result.details)
            return `  ❌ ${result.name}`
          }
          return `  ✅ ${result.name}`
        })
        .join('\n') + '\n',
    )
  }

  const publish = async () => {
    const packageDetails = await getPackageDetails(packagePublishList)
    const results = await Promise.allSettled(
      packageDetails.map((pkg) => publishPackageThrottled(pkg, { dryRun: true })),
    )

    console.log(`\n\nResults:\n`)

    console.log(
      results
        .map((result) => {
          if (result.status === 'rejected') {
            console.error(result.reason)
            return `  ❌ ${String(result.reason)}`
          }
          const { name, success, details } = result.value
          let summary = `  ${success ? '✅' : '❌'} ${name}`
          if (details) {
            summary += `\n    ${details}\n`
          }
          return summary
        })
        .join('\n') + '\n',
    )
  }

  const showVersions = async () => {
    const { packages, version } = await getCurrentPackageState()
    console.log(`\n  Version: ${version}\n`)
    console.log(`  Changes (${packages.length} packages):\n`)
    console.log(`${packages.map((p) => `  - ${p.name.padEnd(32)} ${p.version}`).join('\n')}\n`)
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

  const bumpVersion = async (bumpType: PackageReleaseType) => {
    const { version: monorepoVersion, packages: packageDetails } = await getCurrentPackageState()

    let nextReleaseVersion
    if (bumpType === 'internal') {
      const hash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim().slice(0, 7)
      nextReleaseVersion = semver.inc(monorepoVersion, 'minor') + `-internal.${hash}`
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
      throw new Error(`Invalid bump type: ${bumpType}. Only 'internal' and 'canary' are supported.`)
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
  }

  const workspace: Workspace = {
    version: async () => (await fse.readJSON(ROOT_PACKAGE_JSON)).version,
    tag: 'latest',
    packages: await getPackageDetails(packagePublishList),
    showVersions,
    bumpVersion,
    build,
    publish,
    publishSync,
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

/** Publish with promise concurrency throttling */
async function publishPackageThrottled(pkg: PackageDetails, opts?: { dryRun?: boolean }) {
  const { dryRun = true } = opts ?? {}
  return npmPublishLimit(() => publishSinglePackage(pkg, { dryRun }))
}

async function publishSinglePackage(pkg: PackageDetails, opts: PublishOpts) {
  console.log(`🚀 ${pkg.name} publishing...`)

  const { dryRun, tag = 'canary' } = opts

  try {
    const cmdArgs = ['publish', '-C', pkg.packagePath, '--no-git-checks', '--tag', tag]
    if (dryRun) {
      cmdArgs.push('--dry-run')
    }
    const { exitCode, stderr } = await execa('pnpm', cmdArgs, {
      cwd,
      // stdio: ['ignore', 'ignore', 'pipe'],
      stdio: 'inherit',
    })

    if (exitCode !== 0) {
      console.log(`\n\n❌ ${pkg.name} ERROR: pnpm publish failed\n\n${stderr}`)

      return {
        name: pkg.name,
        success: false,
        details: `Exit Code: ${exitCode}, stderr: ${stderr}`,
      }
    }

    console.log(`✅ ${pkg.name} published`)
    return { name: pkg.name, success: true }
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
