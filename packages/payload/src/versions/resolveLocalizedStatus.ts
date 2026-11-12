import type { SanitizedConfig, SanitizedLocalizationConfig } from '../config/types.js'
import type { Field } from '../fields/config/types.js'
import type { JsonObject, PayloadRequest } from '../types/index.js'

import { mergeLocalizedData } from '../utilities/mergeLocalizedData.js'
import { hasNonLocalizedDataChanged } from './drafts/hasNonLocalizedDataChanged.js'
import { mergeLocalizedStatus } from './mergeLocalizedStatus.js'

type ResolveLocalizedStatusArgs = {
  configBlockReferences: SanitizedConfig['blocks']
  existingDoc: JsonObject
  fields: Field[]
  isSavingDraft: boolean
  locale: string
  localization: SanitizedLocalizationConfig
  req: PayloadRequest
  result: JsonObject
  shouldApplyAllLocalesStatusChange: boolean
  statusFieldAccess: boolean
  unpublishAllLocales?: boolean
}

export const resolveLocalizedStatus = async ({
  configBlockReferences,
  existingDoc,
  fields,
  isSavingDraft,
  locale,
  localization,
  req,
  result,
  shouldApplyAllLocalesStatusChange,
  statusFieldAccess,
  unpublishAllLocales,
}: ResolveLocalizedStatusArgs): Promise<unknown> => {
  const hasStringStatus = typeof result._status === 'string'
  const canUpdateDraftStatus = isSavingDraft && statusFieldAccess
  const isAllLocaleStatusUpdate = locale === 'all' && (hasStringStatus || canUpdateDraftStatus)
  const shouldFilterStatusLocales = shouldApplyAllLocalesStatusChange || isAllLocaleStatusUpdate
  let resolvedStatus = result._status
  let statusLocaleCodes = localization.localeCodes

  if (shouldFilterStatusLocales && localization.filterAvailableLocales) {
    const filteredLocales = await localization.filterAvailableLocales({
      locales: localization.locales,
      req,
    })
    statusLocaleCodes = filteredLocales.map((locale) =>
      typeof locale === 'string' ? locale : locale.code,
    )
  }

  const requestedStatusLocaleCodes = locale === 'all' ? statusLocaleCodes : [locale]

  if (!shouldApplyAllLocalesStatusChange && hasStringStatus) {
    // Update the status for the requested locales while preserving the others.
    resolvedStatus = mergeLocalizedStatus({
      existingStatus: existingDoc._status,
      localeCodes: requestedStatusLocaleCodes,
      status: result._status,
    })
  }

  const shouldDraftAllLocales =
    canUpdateDraftStatus &&
    hasNonLocalizedDataChanged({
      after: mergeLocalizedData({
        configBlockReferences,
        dataWithLocales: result,
        docWithLocales: existingDoc,
        fields,
        localesToUpdate: localization.localeCodes,
      }),
      before: existingDoc,
      configBlockReferences,
      fields,
    })

  if (shouldApplyAllLocalesStatusChange) {
    // Update the status for the locales the user can publish.
    return mergeLocalizedStatus({
      existingStatus: hasStringStatus ? existingDoc._status : resolvedStatus,
      localeCodes: statusLocaleCodes,
      status: unpublishAllLocales ? 'draft' : 'published',
    })
  }

  if (canUpdateDraftStatus) {
    // Update every locale for shared changes, or only the requested locales for localized changes.
    return mergeLocalizedStatus({
      existingStatus: shouldDraftAllLocales ? resolvedStatus : existingDoc._status,
      localeCodes: shouldDraftAllLocales ? localization.localeCodes : requestedStatusLocaleCodes,
      status: 'draft',
    })
  }

  return resolvedStatus
}
