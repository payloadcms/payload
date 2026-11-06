import type { Field } from '../fields/config/types.js'
import type { SanitizedConfig } from '../index.js'
import type { JsonObject } from '../types/index.js'

import { mergeLocalizedData } from '../utilities/mergeLocalizedData.js'

type Args = {
  config: SanitizedConfig
  /**
   * The current main doc fetched with `locale: 'all'`.
   * For collections, pass the result of `payload.db.findOne`.
   * For globals, pass the result of `payload.db.findGlobal`.
   */
  currentDoc: JsonObject | null
  fields: Field[]
  /**
   * The locale being saved (e.g. 'en').
   */
  locale: string
  /**
   * The full locale-keyed result from `beforeChange` — used as the version data.
   */
  result: JsonObject
}

/**
 * Builds the data object to write to the main collection/global doc when saving
 * a single locale. The version row uses `result` as-is (all locales intact); the
 * main doc retains other locales from the current main doc. When publishing, only
 * previously-published locales are retained to avoid exposing stale draft data.
 *
 * Returns the merged object (with `_status` set), ready for the DB write.
 */
export function buildLocalizedPublishData({
  config,
  currentDoc,
  fields,
  locale,
  result,
}: Args): JsonObject {
  const currentDocStatus =
    currentDoc?._status && typeof currentDoc._status === 'object'
      ? (currentDoc._status as Record<string, unknown>)
      : {}

  const resultStatus =
    result._status && typeof result._status === 'object' && !Array.isArray(result._status)
      ? (result._status as Record<string, unknown>)
      : {}
  const localeStatus = resultStatus[locale] ?? currentDocStatus[locale] ?? 'draft'

  // Only carry forward locales that were previously published. The main doc can contain
  // stale draft-locale data written by the initial create (which always inserts into the
  // main collection, even when draft:true). Restricting to published locales prevents that
  // data from leaking into the published doc.
  const previouslyPublishedLocales = Object.entries(currentDocStatus)
    .filter(([, status]) => status === 'published')
    .map(([lc]) => lc)

  const merged = mergeLocalizedData({
    configBlockReferences: config.blocks,
    dataWithLocales: result,
    docWithLocales: currentDoc ?? {},
    fields,
    localesToPreserve: localeStatus === 'published' ? previouslyPublishedLocales : undefined,
    localesToUpdate: [locale],
  })

  // Retain other locales' statuses and apply the saved locale's requested status.
  const mergedStatus: Record<string, unknown> = { ...currentDocStatus }
  mergedStatus[locale] = localeStatus
  merged._status = mergedStatus

  return merged
}
