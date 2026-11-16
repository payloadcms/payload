import semver from 'semver'

/**
 * One canary per UTC day: `<major.minor.patch>-canary.<YYYYMMDD>`. The base is the
 * monorepo version without its prerelease, so a `4.0.0-beta.N` line publishes
 * `4.0.0` canaries. The date sorts above any counter-style canary on the same base.
 */
export const getCanaryVersion = ({
  date,
  monorepoVersion,
}: {
  date: Date
  monorepoVersion: string
}): string => {
  const parsed = semver.parse(monorepoVersion)
  if (!parsed) {
    throw new Error(`Could not parse monorepo version ${monorepoVersion}`)
  }

  const utcDate = date.toISOString().slice(0, 10).replaceAll('-', '')
  return `${parsed.major}.${parsed.minor}.${parsed.patch}-canary.${utcDate}`
}
