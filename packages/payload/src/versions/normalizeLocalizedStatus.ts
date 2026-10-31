import type { JsonObject } from '../types/index.js'

type NormalizeLocalizedStatusArgs = {
  existingStatus: unknown
  hasAuthorizedPublicationStatus: boolean
  locale: string
  localeCodes: string[]
  status: string
}

export const normalizeLocalizedStatus = ({
  existingStatus,
  hasAuthorizedPublicationStatus,
  locale,
  localeCodes,
  status,
}: NormalizeLocalizedStatusArgs): JsonObject => {
  const localizedStatus =
    existingStatus && typeof existingStatus === 'object' && !Array.isArray(existingStatus)
      ? { ...(existingStatus as JsonObject) }
      : {}

  if (!hasAuthorizedPublicationStatus) {
    const localesToUpdate = locale === 'all' ? localeCodes : [locale]

    for (const localeCode of localesToUpdate) {
      localizedStatus[localeCode] = status
    }
  }

  return localizedStatus
}
