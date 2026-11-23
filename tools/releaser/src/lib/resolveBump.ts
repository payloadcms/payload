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
  if (requested === AUTO_BUMP) {
    return { bump: recommended, isOverride: false }
  }

  if (!overrideReason?.trim()) {
    throw new Error(
      `Bump '${requested}' needs an override reason. The commits since the last release call for '${recommended}'. Re-run with bump '${AUTO_BUMP}', or fill in the override reason.`,
    )
  }

  return { bump: requested, isOverride: true }
}
