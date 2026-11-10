import type { UploadEdits, UploadSessionSaveOptions } from 'payload'

import * as qs from 'qs-esm'

/**
 * Reads the request options a save sends in its query string (locale, upload edits and so on),
 * so an upload that finishes the save in the background sends the same ones.
 */
export const getSaveOptions = ({
  action,
}: {
  action?: string
}): undefined | UploadSessionSaveOptions => {
  const search = action?.split('?')[1]

  if (!search) {
    return undefined
  }

  const query = qs.parse(search, { depth: 10 })
  const fallbackLocale = query['fallback-locale']
  const { locale, publishAllLocales, uploadEdits } = query

  return {
    fallbackLocale: typeof fallbackLocale === 'string' ? fallbackLocale : undefined,
    locale: typeof locale === 'string' ? locale : undefined,
    publishAllLocales: publishAllLocales === 'true' || undefined,
    uploadEdits:
      uploadEdits && typeof uploadEdits === 'object' && !Array.isArray(uploadEdits)
        ? (uploadEdits as UploadEdits)
        : undefined,
  }
}
