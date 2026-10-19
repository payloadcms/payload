/**
 * Publish-workflow entry point. Reads the committed version from the checked-out
 * tag, builds, publishes to npm (fail-fast, idempotent, topological order), moves
 * `latest` for packages without a stable release, then generates release notes and
 * upserts a DRAFT GitHub release. No version bump — the bump workflow already
 * committed and tagged the version this run publishes.
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

import { addDistTag } from './lib/addDistTag.js'
import { findChangelogBaseTag } from './lib/findChangelogBaseTag.js'
import { isVersionPublished } from './lib/getPackageRegistryVersions.js'
import { getWorkspace } from './lib/getWorkspace.js'
import { PINNED_MAJOR, pinnedMajorTagGlob } from './lib/pinnedMajor.js'
import { isPreid, PREIDS } from './lib/preids.js'
import { createDraftGitHubRelease } from './utils/createDraftGitHubRelease.js'
import { generateReleaseNotes } from './utils/generateReleaseNotes.js'

/**
 * Packages first published in v4, so they have no stable release for `latest`. A
 * plain install or `npx` resolves `latest`, so each beta publish moves it there to
 * keep plain installs matched with `payload@beta`. Remove once v4 stable publishes
 * to `latest` directly.
 */
export const V4_ONLY_PACKAGES = [
  '@payloadcms/codemod',
  '@payloadcms/tanstack-start',
  '@payloadcms/transformer-sharp',
]

const DIST_TAG_ATTEMPTS = 2

type ReleaseCiDeps = {
  addDistTag: (args: { name: string; tag: string; version: string }) => Promise<void>
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
    addDistTag,
    createDraftGitHubRelease,
    findChangelogBaseTag,
    generateReleaseNotes,
    hasGithubToken,
    log,
    triggerTag,
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
  const tag = preid // narrowed to Preid

  // npm publishes the package.json version, so a tag pushed on a commit with a
  // different version would silently skip as "already published".
  const releaseTag = `v${version}`
  const shouldCheckTriggerTag = !dryRun || triggerTag !== undefined
  if (shouldCheckTriggerTag && triggerTag !== releaseTag) {
    throw new Error(
      `Trigger tag ${triggerTag ?? '(missing)'} does not match package.json version ${releaseTag}.`,
    )
  }

  log(`\n  Publishing ${version} to dist-tag '${tag}'${dryRun ? ' (dry-run)' : ''}\n`)

  const fromVersion = await findChangelogBaseTag({ version })
  if (!fromVersion) {
    throw new Error(`Could not determine changelog base tag for v${version}`)
  }

  const { releaseNotes, releaseUrl } = await generateReleaseNotes({
    fromVersion,
    toVersion: releaseTag,
  })
  log(`Release URL: ${releaseUrl}`)

  // Guards `latest` if another prerelease line joins PREIDS.
  const v4OnlyPackagesToTag = tag === 'beta' ? V4_ONLY_PACKAGES : []

  if (dryRun) {
    log(`[dry-run] would build all packages`)
    log(`[dry-run] would publish all packages to dist-tag '${tag}'`)
    for (const name of v4OnlyPackagesToTag) {
      log(`[dry-run] would point dist-tag 'latest' at ${name}@${version}`)
    }
    log(`[dry-run] would create/upsert draft GitHub release for ${releaseTag}`)
    return
  }

  await workspace.build()
  await workspace.publish({ dryRun, tag })

  // npm accepts dist-tag changes while a new version is still in publish-time
  // scanning, so this runs right after publish without waiting for availability.
  for (const name of v4OnlyPackagesToTag) {
    await tagLatest({ addDistTag, log, name, version })
  }

  const { releaseUrl: draftUrl } = await createDraftGitHubRelease({
    branch: 'main',
    releaseNotes,
    tag: releaseTag,
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
      addDistTag,
      createDraftGitHubRelease,
      findChangelogBaseTag: ({ version }) =>
        findChangelogBaseTag({ isPublished: isVersionPublished, listTags, version }),
      generateReleaseNotes,
      hasGithubToken: Boolean(process.env.GITHUB_TOKEN),
      log: console.log,
      triggerTag: process.env.GITHUB_REF_NAME,
      workspace: getWorkspace(),
    },
    dryRun,
  })
}

/**
 * Moves `latest` to the just-published version. Never throws: the packages are
 * already on npm, and a failed move only leaves `latest` on an older version.
 */
async function tagLatest({
  addDistTag,
  log,
  name,
  version,
}: { name: string; version: string } & Pick<ReleaseCiDeps, 'addDistTag' | 'log'>): Promise<void> {
  let lastError: unknown
  for (let attempt = 1; attempt <= DIST_TAG_ATTEMPTS; attempt++) {
    try {
      await addDistTag({ name, tag: 'latest', version })
      log(`Pointed dist-tag 'latest' at ${name}@${version}`)
      return
    } catch (error: unknown) {
      lastError = error
    }
  }

  const reason = lastError instanceof Error ? lastError.message : String(lastError)
  const message = `Could not point 'latest' at ${name}@${version} (${reason}). Run manually: npm dist-tag add ${name}@${version} latest`
  // `::warning` surfaces as a GitHub Actions run annotation; non-fatal failures in logs alone go unnoticed.
  log(`::warning title=dist-tag latest failed::${escapeWorkflowCommandData(message)}`)
}

/** Workflow commands are single-line; GitHub decodes these escapes in the annotation. */
function escapeWorkflowCommandData(value: string): string {
  return value.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
}
