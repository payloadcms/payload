import type { JsonObject } from '../../types/index.js'

type GetLocalizedDraftStatusArgs = {
  existingStatus: unknown
  locale: string
  localeCodes: string[]
}

export const getLocalizedDraftStatus = ({
  existingStatus,
  locale,
  localeCodes,
}: GetLocalizedDraftStatusArgs): JsonObject => {
  const status =
    existingStatus && typeof existingStatus === 'object' && !Array.isArray(existingStatus)
      ? { ...(existingStatus as JsonObject) }
      : {}

  const localesToDraft = locale === 'all' ? localeCodes : [locale]

  for (const localeCode of localesToDraft) {
    status[localeCode] = 'draft'
  }

  return status
}
