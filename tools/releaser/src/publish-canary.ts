/**
 * Nightly canary entry point. Publishes the checked-out commit as
 * `<base>-canary.<YYYYMMDD>` under the `canary` dist-tag. The version bump stays in
 * the working tree only: no commit, tag, or GitHub release.
 *
 * Usage: pnpm publish-canary [--skip-if-unchanged] [--dry-run]
 *
 * --skip-if-unchanged exits early when the current canary was built from this commit.
 *
 * The bump writes every release package.json to disk, also in --dry-run. Discarded on
 * ephemeral CI; locally revert with `git checkout -- packages package.json`.
 */
import { spawnSync } from 'child_process'
import minimist from 'minimist'
import { pathToFileURL } from 'url'

import type { Workspace } from './lib/getWorkspace.js'

import {
  assertCanaryVersionFromHead,
  getCanarySentinelShortNames,
  isCanaryAtHead,
} from './lib/canarySentinels.js'
import { getPackageDetails } from './lib/getPackageDetails.js'
import { getDistTag, isVersionPublished } from './lib/getPackageRegistryVersions.js'
import { getProvenanceCommit } from './lib/getProvenanceCommit.js'
import { getWorkspace } from './lib/getWorkspace.js'
import { packagePublishList } from './lib/publishList.js'

export type PublishCanaryDeps = {
  assertCanaryVersionFromHead: (args: { head: string; version: string }) => Promise<void>
  getHead: () => string
  isCanaryAtHead: (args: { head: string }) => Promise<boolean>
  log: (message: string) => void
  workspace: Pick<Workspace, 'build' | 'bumpVersion' | 'publish'>
}

export const runPublishCanary = async ({
  deps,
  dryRun,
  shouldSkipIfUnchanged,
}: {
  deps: PublishCanaryDeps
  dryRun: boolean
  shouldSkipIfUnchanged: boolean
}): Promise<'published' | 'skipped'> => {
  const head = deps.getHead()

  if (shouldSkipIfUnchanged && (await deps.isCanaryAtHead({ head }))) {
    deps.log(`No new commits since the last canary (${head}); skipping`)
    return 'skipped'
  }

  const version = await deps.workspace.bumpVersion('canary')
  // Before the build, so a same-day conflict fails in seconds, not after a full build.
  try {
    await deps.assertCanaryVersionFromHead({ head, version })
  } catch (err: unknown) {
    if (!dryRun) {
      throw err
    }
    deps.log(`Dry run: a real run would fail: ${err instanceof Error ? err.message : String(err)}`)
  }
  await deps.workspace.build()
  await deps.workspace.publish({ dryRun, tag: 'canary' })
  return 'published'
}

async function main(): Promise<void> {
  const argv = minimist(process.argv.slice(2))
  const registry = { getDistTag, getProvenanceCommit, isVersionPublished }
  const sentinelNames = (
    await getPackageDetails(getCanarySentinelShortNames({ publishList: packagePublishList }))
  ).map((pkg) => pkg.name)

  const result = await runPublishCanary({
    deps: {
      assertCanaryVersionFromHead: ({ head, version }) =>
        assertCanaryVersionFromHead({ head, registry, sentinelNames, version }),
      getHead,
      isCanaryAtHead: ({ head }) =>
        isCanaryAtHead({ head, log: console.log, registry, sentinelNames }),
      log: console.log,
      workspace: getWorkspace(),
    },
    dryRun: Boolean(argv['dry-run']),
    shouldSkipIfUnchanged: Boolean(argv['skip-if-unchanged']),
  })
  console.log(`Canary ${result}`)
}

function getHead(): string {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' })
  const head = result.stdout?.trim()
  if (result.status !== 0 || !head) {
    throw new Error(`git rev-parse HEAD failed: ${result.stderr || result.error?.message}`)
  }
  return head
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
}
