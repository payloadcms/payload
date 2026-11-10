import semver from 'semver'

import { isPinnedMajor, PINNED_MAJOR, RELEASE_BRANCH } from './pinnedMajor.js'

export const STABLE_BUMPS = ['patch', 'minor'] as const

export type StableBump = (typeof STABLE_BUMPS)[number]

type BumpPreconditions = {
  branch: string
  bump: string
  hasGithubToken: boolean
  version: string
}

type ValidatedBumpPreconditions = {
  branch: string
  bump: StableBump
  hasGithubToken: boolean
  version: string
}

/**
 * Validates every bump precondition, throwing (fail-closed) on the first violation
 * so the caller aborts before any git write.
 */
export function assertBumpPreconditions(
  args: BumpPreconditions,
): asserts args is ValidatedBumpPreconditions {
  if (args.branch !== RELEASE_BRANCH) {
    throw new Error(
      `Releases must be run from '${RELEASE_BRANCH}'. Current branch: ${args.branch}.`,
    )
  }

  if (!isPinnedMajor(args.version)) {
    throw new Error(
      `Expected a v${PINNED_MAJOR}.x version; package.json version is ${args.version}. This flow is pinned to v${PINNED_MAJOR}.`,
    )
  }

  if (semver.prerelease(args.version) !== null) {
    throw new Error(
      `Stable releases require a stable current version; ${args.version} has a prerelease identifier.`,
    )
  }

  if (!isStableBump(args.bump)) {
    throw new Error(`Invalid --bump '${args.bump}'. Must be one of: ${STABLE_BUMPS.join(', ')}.`)
  }

  // Guard the resulting version so a bump can never leave the pinned major line.
  const nextVersion = semver.inc(args.version, args.bump)
  if (!nextVersion || semver.major(nextVersion) !== PINNED_MAJOR) {
    throw new Error(
      `Bump '${args.bump}' would produce ${nextVersion ?? 'an invalid version'}, which leaves the pinned v${PINNED_MAJOR} line.`,
    )
  }

  if (!args.hasGithubToken) {
    throw new Error('GITHUB_TOKEN env var is required')
  }
}

const isStableBump = (value: string): value is StableBump =>
  (STABLE_BUMPS as readonly string[]).includes(value)
