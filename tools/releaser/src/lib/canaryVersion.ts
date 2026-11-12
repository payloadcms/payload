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

  return `${baseVersion}-canary.${formatUtcDate(date)}`
}

const formatUtcDate = (date: Date): string => {
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${date.getUTCFullYear()}${month}${day}`
}
