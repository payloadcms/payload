import type { JsonObject } from '../types/index.js'

type MergeLocalizedStatusArgs = {
  existingStatus: unknown
  localeCodes: string[]
  status: string
}

export const mergeLocalizedStatus = ({
  existingStatus,
  localeCodes,
  status,
}: MergeLocalizedStatusArgs): JsonObject => {
  const localizedStatus =
    existingStatus && typeof existingStatus === 'object' && !Array.isArray(existingStatus)
      ? { ...(existingStatus as JsonObject) }
      : {}

  for (const localeCode of localeCodes) {
    localizedStatus[localeCode] = status
  }

  return localizedStatus
}
