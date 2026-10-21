/**
 * Bump-workflow entry point in the dispatch → tag → publish release flow.
 *
 * Computes the next prerelease version from main's committed version, commits it,
 * tags it, and pushes HEAD:main + the tag (with a rebase-retry loop). It does NOT
 * build or publish — the pushed tag triggers the separate publish workflow.
 *
 * Usage:
 *   GITHUB_TOKEN=... pnpm release-bump --preid <canary|beta> \
 *     [--bump <auto|prerelease|prepatch|preminor|premajor>] \
 *     [--override-reason "<why>"] [--dry-run]
 *
 * In --dry-run, git commands are logged (not executed) and nothing is pushed, but
 * the version bump is still written to local package.json (bumpVersion has no
 * dry-run path). Discarded on ephemeral CI; locally revert with
 * `git checkout -- packages package.json`. The dry run also previews the release
 * notes CI drafts for the tag, in the log and the job summary.
 */
import { PROJECT_ROOT } from '@tools/constants'
import { execSync } from 'child_process'
import minimist from 'minimist'
import { pathToFileURL } from 'url'

import type { Workspace } from './lib/getWorkspace.js'

import { assertBumpPreconditions } from './lib/assertBumpPreconditions.js'
import { findChangelogBaseTag } from './lib/findChangelogBaseTag.js'
import { isVersionPublished } from './lib/getPackageRegistryVersions.js'
import { getWorkspace } from './lib/getWorkspace.js'
import { listReleaseTags } from './lib/listReleaseTags.js'
import { pushWithRebaseRetry } from './lib/pushWithRebaseRetry.js'
import { AUTO_BUMP, recommendBump, resolveBump } from './lib/resolveBump.js'
import { runCommand } from './lib/runCommand.js'
import { writeStepSummary } from './lib/writeStepSummary.js'
import { generateReleaseNotes } from './utils/generateReleaseNotes.js'
import { getRecommendedBump } from './utils/getRecommendedBump.js'

type ReleaseBumpDeps = {
  env: NodeJS.ProcessEnv
  findChangelogBaseTag: (args: { version: string }) => Promise<string | undefined>
  generateReleaseNotes: (args: {
    fromVersion: string
    releaseTag: string
    toVersion: string
  }) => Promise<{ releaseNotes: string }>
  getCommitBump: (fromTag: string) => Promise<null | string>
  isPublished: (args: { name: string; version: string }) => Promise<boolean>
  log: (message: string) => void
  readBranch: () => string
  run: (cmd: string) => void
  workspace: Pick<Workspace, 'bumpVersion' | 'version'>
  /** Appends markdown to the CI job summary */
  writeSummary: (markdown: string) => void
}

/** Package for the already-published guard */
const GUARD_PACKAGE = 'payload'

export const runReleaseBump = async ({
  bump: requestedBump,
  deps,
  dryRun,
  overrideReason,
  preid,
}: {
  bump: string
  deps: ReleaseBumpDeps
  dryRun: boolean
  overrideReason?: string
  preid: string
}): Promise<string> => {
  const {
    env,
    findChangelogBaseTag,
    generateReleaseNotes,
    getCommitBump,
    isPublished,
    log,
    readBranch,
    run,
    workspace,
    writeSummary,
  } = deps

  const version = await workspace.version()
  const recommended = await recommendBump({
    getCommitBump: () => getCommitBump(`v${version}`),
    version,
  })
  const { bump, isOverride } = resolveBump({
    overrideReason,
    recommended,
    requested: requestedBump,
  })

  if (isOverride) {
    const reason = (overrideReason ?? '')
      .replace(/%/g, '%25')
      .replace(/\r/g, '%0D')
      .replace(/\n/g, '%0A')
    log(
      `::notice title=Bump override::Releasing as '${bump}' (the commits call for '${recommended}'). Reason: ${reason}`,
    )
  }

  const validated = {
    branch: readBranch(),
    bump,
    hasGithubToken: Boolean(env.GITHUB_TOKEN),
    preid,
    version,
  }

  assertBumpPreconditions(validated)

  const nextVersion = await workspace.bumpVersion(validated.bump, { preid: validated.preid })
  const tag = `v${nextVersion}`

  if (await isPublished({ name: GUARD_PACKAGE, version: nextVersion })) {
    throw new Error(
      `${GUARD_PACKAGE}@${nextVersion} is already published. main's committed version (${validated.version}) trails the registry — reseed it to the latest published version and re-dispatch.`,
    )
  }

  log(`\n  ${validated.version} => ${nextVersion}  (tag ${tag})\n`)

  // The tag's range differs from base..HEAD only by its own bump commit, which the notes
  // filter drops, so for the same commits this preview has the same entries as the CI draft.
  if (dryRun) {
    const fromVersion = await findChangelogBaseTag({ version: nextVersion })
    if (!fromVersion) {
      throw new Error(`Could not determine changelog base tag for ${tag}`)
    }

    const { releaseNotes } = await generateReleaseNotes({
      fromVersion,
      releaseTag: tag,
      toVersion: 'HEAD',
    })
    log(releaseNotes)
    writeSummary(releaseNotes)
  }

  run(`git config user.name "github-actions[bot]"`)
  run(`git config user.email "github-actions[bot]@users.noreply.github.com"`)
  run(`git add packages/**/package.json package.json`)
  run(`git commit -m "chore(release): ${tag}"`)
  run(`git tag -a ${tag} -m ${tag}`)

  await pushWithRebaseRetry({ dryRun, log, run, tag })

  return nextVersion
}

async function main(): Promise<void> {
  const argv = minimist(process.argv.slice(2), { string: ['bump', 'override-reason', 'preid'] })
  const bump = argv.bump || AUTO_BUMP
  const preid = argv.preid || 'beta'
  const overrideReason = argv['override-reason'] || undefined
  const dryRun = Boolean(argv['dry-run'])

  const run = (cmd: string): void => {
    if (dryRun) {
      console.log(`[dry-run] ${cmd}`)
      return
    }
    runCommand({ cmd, cwd: PROJECT_ROOT })
  }

  await runReleaseBump({
    bump,
    deps: {
      env: process.env,
      findChangelogBaseTag: ({ version }) =>
        findChangelogBaseTag({
          isPublished: isVersionPublished,
          listTags: listReleaseTags,
          version,
        }),
      generateReleaseNotes,
      getCommitBump: (fromTag) => getRecommendedBump(fromTag, 'HEAD'),
      isPublished: isVersionPublished,
      log: console.log,
      readBranch: () => execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim(),
      run,
      workspace: getWorkspace(),
      writeSummary: (markdown) =>
        writeStepSummary({ markdown, summaryPath: process.env.GITHUB_STEP_SUMMARY }),
    },
    dryRun,
    overrideReason,
    preid,
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
}
