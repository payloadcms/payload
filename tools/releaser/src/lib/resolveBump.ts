import semver from 'semver'

export const AUTO_BUMP = 'auto'

export async function recommendBump({
  getCommitBump,
  version,
}: {
  getCommitBump: () => Promise<null | string>
  version: string
}): Promise<string> {
  if (semver.prerelease(version)) {
    return 'prerelease'
  }

  return (await getCommitBump()) ?? 'patch'
}

export function resolveBump({
  overrideReason,
  recommended,
  requested,
}: {
  overrideReason?: string
  recommended: string
  requested: string
}): { bump: string; isOverride: boolean } {
  if (requested === AUTO_BUMP || requested === recommended) {
    return { bump: recommended, isOverride: false }
  }

  if (!overrideReason?.trim()) {
    throw new Error(
      `The commits since the last release call for a '${recommended}' bump, but '${requested}' was requested. Re-run with bump '${AUTO_BUMP}', or set an override reason to release as '${requested}' anyway.`,
    )
  }

  return { bump: requested, isOverride: true }
}
