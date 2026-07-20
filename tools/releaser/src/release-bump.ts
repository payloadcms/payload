/**
 * Bump-workflow entry point in the dispatch → tag → publish release flow.
 *
 * Computes the next prerelease version from main's committed version, commits it,
 * tags it, and pushes HEAD:main + the tag (with a rebase-retry loop). It does NOT
 * build or publish — the pushed tag triggers the separate publish workflow.
 *
 * Usage:
 *   GITHUB_TOKEN=... pnpm release-bump --preid <canary|beta> \
 *     --bump <prerelease|prepatch|preminor|premajor> [--dry-run]
 *
 * In --dry-run, git commands are logged (not executed) and nothing is pushed, but
 * the version bump is still written to local package.json (bumpVersion has no
 * dry-run path). Discarded on ephemeral CI; locally revert with
 * `git checkout -- packages package.json`.
 */
import { PROJECT_ROOT } from '@tools/constants'
import { execSync } from 'child_process'
import minimist from 'minimist'
import { pathToFileURL } from 'url'

import type { Workspace } from './lib/getWorkspace.js'

import { assertBumpPreconditions } from './lib/assertBumpPreconditions.js'
import { getWorkspace } from './lib/getWorkspace.js'
import { pushWithRebaseRetry } from './lib/pushWithRebaseRetry.js'

type ReleaseBumpDeps = {
  env: NodeJS.ProcessEnv
  log: (message: string) => void
  readBranch: () => string
  run: (cmd: string) => void
  workspace: Pick<Workspace, 'bumpVersion' | 'version'>
}

export const runReleaseBump = async ({
  bump,
  deps,
  dryRun,
  preid,
}: {
  bump: string
  deps: ReleaseBumpDeps
  dryRun: boolean
  preid: string
}): Promise<string> => {
  const { env, log, readBranch, run, workspace } = deps

  const validated = {
    branch: readBranch(),
    bump,
    hasGithubToken: Boolean(env.GITHUB_TOKEN),
    preid,
    version: await workspace.version(),
  }

  assertBumpPreconditions(validated)

  const nextVersion = await workspace.bumpVersion(validated.bump, { preid: validated.preid })
  const tag = `v${nextVersion}`

  log(`\n  ${validated.version} => ${nextVersion}  (tag ${tag})\n`)

  run(`git config user.name "github-actions[bot]"`)
  run(`git config user.email "github-actions[bot]@users.noreply.github.com"`)
  run(`git add packages/**/package.json package.json`)
  run(`git commit -m "chore(release): ${tag}"`)
  run(`git tag -a ${tag} -m ${tag}`)

  await pushWithRebaseRetry({ dryRun, log, run, tag })

  return nextVersion
}

async function main(): Promise<void> {
  const argv = minimist(process.argv.slice(2))
  const bump = typeof argv.bump === 'string' ? argv.bump : 'prerelease'
  const preid = typeof argv.preid === 'string' ? argv.preid : 'canary'
  const dryRun = Boolean(argv['dry-run'])

  const run = (cmd: string): void => {
    if (dryRun) {
      console.log(`[dry-run] ${cmd}`)
      return
    }
    execSync(cmd, { cwd: PROJECT_ROOT, stdio: 'inherit' })
  }

  await runReleaseBump({
    bump,
    deps: {
      env: process.env,
      log: console.log,
      readBranch: () => execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim(),
      run,
      workspace: getWorkspace(),
    },
    dryRun,
    preid,
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
}
