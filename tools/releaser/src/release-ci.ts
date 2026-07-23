/**
 * Publish-workflow entry point. Reads the committed version from the checked-out
 * tag, builds, publishes to npm (fail-fast, idempotent, topological order), then
 * generates release notes and upserts a DRAFT GitHub release. No version bump — the
 * bump workflow already committed and tagged the version this run publishes.
 *
 * Usage: pnpm release-ci [--dry-run]
 *
 * In --dry-run, build/publish/draft are skipped (logged); the read-only notes
 * preview still runs.
 */
import { execSync } from 'child_process'
import minimist from 'minimist'
import semver from 'semver'
import { pathToFileURL } from 'url'

import type { Workspace } from './lib/getWorkspace.js'

import { findChangelogBaseTag } from './lib/findChangelogBaseTag.js'
import { isVersionPublished } from './lib/getPackageRegistryVersions.js'
import { getWorkspace } from './lib/getWorkspace.js'
import { PINNED_MAJOR, pinnedMajorTagGlob } from './lib/pinnedMajor.js'
import { isPreid, PREIDS } from './lib/preids.js'
import { createDraftGitHubRelease } from './utils/createDraftGitHubRelease.js'
import { generateReleaseNotes } from './utils/generateReleaseNotes.js'

type ReleaseCiDeps = {
  createDraftGitHubRelease: (args: {
    branch: string
    releaseNotes: string
    tag: string
  }) => Promise<{ releaseUrl: string }>
  findChangelogBaseTag: (args: { version: string }) => Promise<string | undefined>
  generateReleaseNotes: (args: {
    fromVersion?: string
    toVersion?: string
  }) => Promise<{ releaseNotes: string; releaseUrl: string }>
  hasGithubToken: boolean
  log: (message: string) => void
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
    log,
    workspace,
  } = deps

  // Fail fast before publishing: release notes and the draft release both need a
  // token, so a missing one must abort up front rather than after packages ship.
  if (!hasGithubToken) {
    throw new Error('GITHUB_TOKEN env var is required')
  }

  const version = await workspace.version()

  // Major-version guard: defense-in-depth against a non-pinned-major tag reaching
  // this flow. A v3 beta would otherwise pass the dist-tag classifier and mis-publish.
  if (semver.major(version) !== PINNED_MAJOR) {
    throw new Error(
      `release-ci is pinned to v${PINNED_MAJOR}; refusing to publish version ${version}.`,
    )
  }

  // Fail closed: only the allowlisted prerelease lines may publish. A stable
  // version (no preid) or an unsupported line (e.g. internal) must throw rather
  // than default to the production 'latest' dist-tag.
  const preid = semver.prerelease(version)?.[0]
  if (!isPreid(preid)) {
    throw new Error(
      `Refusing to publish ${version}: prerelease line must be one of ${PREIDS.join(', ')} (got ${preid ?? 'none'}).`,
    )
  }
  const tag = preid // narrowed to 'beta' | 'canary'

  log(`\n  Publishing ${version} to dist-tag '${tag}'${dryRun ? ' (dry-run)' : ''}\n`)

  const fromVersion = await findChangelogBaseTag({ version })
  const { releaseNotes, releaseUrl } = await generateReleaseNotes({
    fromVersion,
    toVersion: 'HEAD',
  })
  log(`Release URL: ${releaseUrl}`)

  if (dryRun) {
    log(`[dry-run] would build all packages`)
    log(`[dry-run] would publish all packages to dist-tag '${tag}'`)
    log(`[dry-run] would create/upsert draft GitHub release for v${version}`)
    return
  }

  await workspace.build()
  await workspace.publish({ dryRun, tag })

  const { releaseUrl: draftUrl } = await createDraftGitHubRelease({
    branch: 'main',
    releaseNotes,
    tag: `v${version}`,
  })
  log(`Draft release: ${draftUrl}`)
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
      log: console.log,
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
