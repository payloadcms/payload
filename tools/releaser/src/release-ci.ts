/**
 * Publish-workflow entry point (P2). Reads the committed version from the checked-out
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

import { findChangelogBaseTag, lineFromVersion } from './lib/findChangelogBaseTag.js'
import { isVersionPublished } from './lib/getPackageRegistryVersions.js'
import { getWorkspace } from './lib/getWorkspace.js'
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
  const { createDraftGitHubRelease, findChangelogBaseTag, generateReleaseNotes, log, workspace } =
    deps

  const version = await workspace.version()

  // Major-version guard (D19): defense-in-depth against a non-v4 tag reaching this
  // flow. A v3 beta would otherwise pass the dist-tag classifier and mis-publish.
  if (semver.major(version) !== 4) {
    throw new Error(`release-ci is pinned to v4; refusing to publish version ${version}.`)
  }

  const line = lineFromVersion(version)
  if (line === 'latest') {
    throw new Error(
      `Stable ('latest') publishes are not supported by this flow; version ${version} has no beta/canary prerelease id.`,
    )
  }
  const tag = line // narrowed to 'beta' | 'canary'

  log(`\n  Publishing ${version} to dist-tag '${tag}'${dryRun ? ' (dry-run)' : ''}\n`)

  if (dryRun) {
    log(`[dry-run] would build all packages`)
    log(`[dry-run] would publish all packages to dist-tag '${tag}'`)
  } else {
    await workspace.build()
    await workspace.publish({ dryRun, tag })
  }

  const fromVersion = await findChangelogBaseTag({ version })
  const { releaseNotes, releaseUrl } = await generateReleaseNotes({
    fromVersion,
    toVersion: 'HEAD',
  })
  log(`Release URL: ${releaseUrl}`)

  if (dryRun) {
    log(`[dry-run] would create/upsert draft GitHub release for v${version}`)
    return
  }

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
    execSync(`git tag --list 'v4.*'`, { encoding: 'utf8' })
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

  await runReleaseCi({
    deps: {
      createDraftGitHubRelease,
      findChangelogBaseTag: ({ version }) =>
        findChangelogBaseTag({ isPublished: isVersionPublished, listTags, version }),
      generateReleaseNotes,
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
