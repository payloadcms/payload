import semver from 'semver'

import type { Preid } from './preids.js'

import { isPinnedMajor, PINNED_MAJOR } from './pinnedMajor.js'
import { isPreid, PREIDS } from './preids.js'

export const PRERELEASE_BUMPS = ['premajor', 'preminor', 'prepatch', 'prerelease'] as const

export type PrereleaseBump = (typeof PRERELEASE_BUMPS)[number]

type BumpPreconditions = {
  branch: string
  bump: string
  hasGithubToken: boolean
  preid: string
  version: string
}

type ValidatedBumpPreconditions = {
  branch: string
  bump: PrereleaseBump
  hasGithubToken: boolean
  preid: Preid
  version: string
}

/**
 * Validates every bump precondition, throwing (fail-closed) on the first violation
 * so the caller aborts before any git write. Ported from the inline guards in
 * release.ts. The version must carry *a* prerelease identifier, but it need not
 * match `preid` — a canary.N → beta.0 transition is expected and allowed.
 */
export function assertBumpPreconditions(
  args: BumpPreconditions,
): asserts args is ValidatedBumpPreconditions {
  if (args.branch !== 'main') {
    throw new Error(`Releases must be run from 'main'. Current branch: ${args.branch}.`)
  }

  if (!isPinnedMajor(args.version)) {
    throw new Error(
      `Expected a v${PINNED_MAJOR}.x version; package.json version is ${args.version}. This flow is pinned to v${PINNED_MAJOR} during the beta phase.`,
    )
  }

  if (!semver.prerelease(args.version)?.[0]) {
    throw new Error(
      `Stable releases are disallowed during the v4 beta phase; version ${args.version} has no prerelease identifier.`,
    )
  }

  if (!isPreid(args.preid)) {
    throw new Error(`Invalid --preid '${args.preid}'. Must be one of: ${PREIDS.join(', ')}.`)
  }

  if (!isPrereleaseBump(args.bump)) {
    throw new Error(
      `Invalid --bump '${args.bump}'. Must be one of: ${PRERELEASE_BUMPS.join(', ')}.`,
    )
  }

  if (!args.hasGithubToken) {
    throw new Error('GITHUB_TOKEN env var is required')
  }
}

const isPrereleaseBump = (value: string): value is PrereleaseBump =>
  (PRERELEASE_BUMPS as readonly string[]).includes(value)
