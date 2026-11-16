export type RestoredStatus = 'draft' | 'published'

/**
 * Returns the distinct publication statuses a restore will write, so `access.update` can be
 * checked for each one. `_status` is a scalar, or a per-locale object when
 * `versions.drafts.localizeStatus` is on - a localized restore can publish and unpublish locales
 * at once, so both intents are returned and each must pass. Empty when `_status` is absent.
 */
export const getRestoredStatusesToAuthorize = (rawStatus: unknown): RestoredStatus[] => {
  if (typeof rawStatus === 'string') {
    return [rawStatus === 'published' ? 'published' : 'draft']
  }

  if (rawStatus && typeof rawStatus === 'object' && !Array.isArray(rawStatus)) {
    const statuses = new Set<RestoredStatus>()

    for (const value of Object.values(rawStatus as Record<string, unknown>)) {
      statuses.add(value === 'published' ? 'published' : 'draft')
    }

    return Array.from(statuses)
  }

  return []
}
