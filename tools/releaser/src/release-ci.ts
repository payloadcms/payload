/**
 * Publish-workflow entry point. Reads the committed version from the checked-out
 * tag, resolves each package's stable dist-tag (`latest` or `payload-3`) from npm,
 * generates release notes, builds, publishes to npm (fail-fast, idempotent,
 * topological order), then upserts a DRAFT GitHub release. No version bump — the
 * bump workflow already committed and tagged the version this run publishes.
 *
 * Usage: pnpm release-ci [--dry-run]
 *
 * In --dry-run, build/publish/draft are skipped (logged); the dist-tag resolution
 * and read-only notes preview still run.
 */
import { execSync } from 'child_process'
import minimist from 'minimist'
import semver from 'semver'
import { pathToFileURL } from 'url'

import type { Workspace } from './lib/getWorkspace.js'
import type { StableDistTag } from './lib/stableDistTag.js'

import { findChangelogBaseTag } from './lib/findChangelogBaseTag.js'
import { getPackageDetails } from './lib/getPackageDetails.js'
import { getDistTagVersion, isVersionPublished } from './lib/getPackageRegistryVersions.js'
import { getWorkspace } from './lib/getWorkspace.js'
import { PINNED_MAJOR, pinnedMajorTagGlob, RELEASE_BRANCH } from './lib/pinnedMajor.js'
import { packagePublishList } from './lib/publishList.js'
import { resolveStableDistTags } from './lib/stableDistTag.js'
import {
  createDraftGitHubRelease,
  NOT_LATEST_PUBLISH_REMINDER,
} from './utils/createDraftGitHubRelease.js'
import { generateReleaseNotes } from './utils/generateReleaseNotes.js'

type ReleaseCiDeps = {
  createDraftGitHubRelease: (args: {
    branch: string
    makeLatest: boolean
    releaseNotes: string
    tag: string
  }) => Promise<{ releaseUrl: string }>
  findChangelogBaseTag: (args: { version: string }) => Promise<string | undefined>
  generateReleaseNotes: (args: {
    fromVersion?: string
    toVersion?: string
  }) => Promise<{ releaseNotes: string; releaseUrl: string }>
  hasGithubToken: boolean
  listPackageNames: () => Promise<string[]>
  log: (message: string) => void
  resolveDistTags: (args: {
    names: string[]
    version: string
  }) => Promise<Map<string, StableDistTag>>
  /** Tag that triggered the workflow (`GITHUB_REF_NAME`). Required unless dry-run. */
  triggerTag: string | undefined
  workspace: Pick<Workspace, 'build' | 'publish' | 'version'>
}

export const runReleaseCi = async ({
  deps,
  dryRun,
}: {
  deps: ReleaseCiDeps
  dryRun: boolean
}): Promise<void> => {
  const {
    createDraftGitHubRelease,
    findChangelogBaseTag,
    generateReleaseNotes,
    hasGithubToken,
    listPackageNames,
    log,
    resolveDistTags,
    triggerTag,
    workspace,
  } = deps

  // Fail fast before publishing: release notes and the draft release both need a
  // token, so a missing one must abort up front rather than after packages ship.
  if (!hasGithubToken) {
    throw new Error('GITHUB_TOKEN env var is required')
  }

  const version = await workspace.version()

  // Defense-in-depth: a tag from another major must never reach the stable dist-tag logic.
  if (semver.major(version) !== PINNED_MAJOR) {
    throw new Error(
      `release-ci is pinned to v${PINNED_MAJOR}; refusing to publish version ${version}.`,
    )
  }

  // Prereleases ship through the prerelease workflow; this flow only publishes stable tags.
  if (semver.prerelease(version) !== null) {
    throw new Error(`Refusing to publish prerelease version ${version}; stable versions only.`)
  }

  // npm publishes the package.json version, so a tag pushed on a commit with a
  // different version would silently skip as "already published".
  const releaseTag = `v${version}`
  const shouldCheckTriggerTag = !dryRun || triggerTag !== undefined
  if (shouldCheckTriggerTag && triggerTag !== releaseTag) {
    throw new Error(
      `Trigger tag ${triggerTag ?? '(missing)'} does not match package.json version ${releaseTag}.`,
    )
  }

  // Resolved before building so a registry failure or a missing 'payload' entry
  // stops the run before anything ships; a wrong 'latest' would move every default install.
  const distTags = await resolveDistTags({ names: await listPackageNames(), version })
  const payloadDistTag = distTags.get('payload')
  if (!payloadDistTag) {
    throw new Error(`No dist-tag resolved for 'payload'; refusing to publish ${version}.`)
  }

  log(`\n  Publishing ${version}${dryRun ? ' (dry-run)' : ''}`)
  for (const [name, distTag] of distTags) {
    log(`  ${name} -> ${distTag}`)
  }
  log('')

  const fromVersion = await findChangelogBaseTag({ version })
  if (!fromVersion) {
    throw new Error(`Could not determine changelog base tag for v${version}`)
  }

  const { releaseNotes, releaseUrl } = await generateReleaseNotes({
    fromVersion,
    toVersion: releaseTag,
  })
  log(`Release URL: ${releaseUrl}`)

  if (dryRun) {
    log(`[dry-run] would build all packages`)
    log(`[dry-run] would publish all packages with the dist-tags above`)
    log(`[dry-run] would create/upsert draft GitHub release for ${releaseTag}`)
    return
  }

  await workspace.build()
  await workspace.publish({ dryRun, tag: distTags })

  const makeLatest = payloadDistTag === 'latest'
  const { releaseUrl: draftUrl } = await createDraftGitHubRelease({
    branch: RELEASE_BRANCH,
    makeLatest,
    releaseNotes,
    tag: releaseTag,
  })
  log(`Draft release: ${draftUrl}`)
  if (!makeLatest) {
    log(NOT_LATEST_PUBLISH_REMINDER)
  }
}

async function main(): Promise<void> {
  const argv = minimist(process.argv.slice(2))
  const dryRun = Boolean(argv['dry-run'])

  const listTags = (): string[] =>
    execSync(`git tag --list '${pinnedMajorTagGlob}'`, { encoding: 'utf8' })
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

  await runReleaseCi({
    deps: {
      createDraftGitHubRelease,
      findChangelogBaseTag: ({ version }) =>
        findChangelogBaseTag({ isPublished: isVersionPublished, listTags, version }),
      generateReleaseNotes,
      hasGithubToken: Boolean(process.env.GITHUB_TOKEN),
      listPackageNames: async () =>
        (await getPackageDetails(packagePublishList)).map((pkg) => pkg.name),
      log: console.log,
      resolveDistTags: ({ names, version }) =>
        resolveStableDistTags({ getDistTagVersion, names, version }),
      triggerTag: process.env.GITHUB_REF_NAME,
      workspace: getWorkspace(),
    },
    dryRun,
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
}
