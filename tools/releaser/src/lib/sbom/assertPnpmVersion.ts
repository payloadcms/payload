import semver from 'semver'

export const MIN_PNPM_VERSION = '11.28.6'

export const assertPnpmVersion = ({ version }: { version: string }): void => {
  if (semver.lt(version, MIN_PNPM_VERSION)) {
    throw new Error(
      `pnpm ${version} is too old for SBOM generation, need >= ${MIN_PNPM_VERSION}: older pnpm writes invalid CycloneDX license ids and drops platform-binary licenses`,
    )
  }
}
