import semver from 'semver'

/**
 * The single major version the release flow is pinned to during the v4 beta phase.
 * Both entry scripts and the changelog tag filter derive their v4 checks from this
 * one constant so lifting the pin (e.g. to v5) is a one-line change.
 */
export const PINNED_MAJOR = 4

export const isPinnedMajor = (version: string): boolean =>
  semver.valid(version) !== null && semver.major(version) === PINNED_MAJOR

/** The `git tag --list` glob matching every tag on the pinned major, e.g. `v4.*`. */
export const pinnedMajorTagGlob = `v${PINNED_MAJOR}.*`
