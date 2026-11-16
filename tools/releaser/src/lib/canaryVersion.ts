import semver from 'semver'

/**
 * One canary per UTC day: `<minor-inc base>-canary.<YYYYMMDD>`. The date sorts above
 * any counter-style canary on the same base, and a prerelease base keeps its version.
 */
export const getCanaryVersion = ({
  date,
  monorepoVersion,
}: {
  date: Date
  monorepoVersion: string
}): string => {
  const baseVersion = semver.inc(monorepoVersion, 'minor')
  if (!baseVersion) {
    throw new Error(`Could not determine minor candidate version from ${monorepoVersion}`)
  }

  const utcDate = date.toISOString().slice(0, 10).replaceAll('-', '')
  return `${baseVersion}-canary.${utcDate}`
}
