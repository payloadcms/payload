import semver from 'semver'

/**
 * The single major version the release flow publishes. Both entry scripts and the
 * changelog tag filter derive their v3 checks from this one constant.
 */
export const PINNED_MAJOR = 3

/** The branch the pinned major line is released from. */
export const RELEASE_BRANCH = '3.x'

export const isPinnedMajor = (version: string): boolean =>
  semver.valid(version) !== null && semver.major(version) === PINNED_MAJOR

/** The `git tag --list` glob matching every tag on the pinned major, e.g. `v3.*`. */
export const pinnedMajorTagGlob = `v${PINNED_MAJOR}.*`
