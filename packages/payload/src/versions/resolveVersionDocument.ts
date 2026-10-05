import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../globals/config/types.js'
import type { JsonObject, PayloadRequest } from '../types/index.js'
import type { DocumentVersion } from '../types/operations.js'

import { hasLocalizeStatusEnabled } from '../utilities/getVersionsConfig.js'
import { mergeLocalizedData } from '../utilities/mergeLocalizedData.js'
import { mapLocalizedFields } from './mapLocalizedFields.js'

/** Resolve a localized read using the active draft only in locales whose status is draft. */
export function resolveVersionDocument<T extends JsonObject>({
  doc,
  entity,
  publishedDoc,
  req,
  version,
}: {
  doc: T
  entity: SanitizedCollectionConfig | SanitizedGlobalConfig
  publishedDoc?: JsonObject | null
  req: PayloadRequest
  version: DocumentVersion
}): T {
  const { localization } = req.payload.config

  if (!localization || !hasLocalizeStatusEnabled(entity)) {
    return doc
  }

  let result: JsonObject = doc

  if (version === 'latest' && publishedDoc) {
    const publishedLocales = localization.localeCodes.filter(
      (code) => doc._status?.[code] !== 'draft',
    )

    result = mergeLocalizedData({
      configBlockReferences: req.payload.config.blocks,
      dataWithLocales: publishedDoc,
      docWithLocales: doc,
      fields: entity.fields,
      localesToUpdate: publishedLocales,
      preserveNonLocalized: true,
    })
  }

  if ((req.locale === 'all' || req.locale === '*') && version !== 'latest') {
    const statuses = result._status

    result = mapLocalizedFields({
      data: result,
      fields: entity.fields,
      req,
      transform: ({ value }) =>
        value && typeof value === 'object' && !Array.isArray(value)
          ? Object.fromEntries(
              Object.entries(value).filter(([code]) => statuses?.[code] === version),
            )
          : value,
    })
  }

  return result as T
}
